import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { json, NextFunction, Request, Response, urlencoded } from 'express';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { RedisService } from './redis/providers/redis.service';
import { MetricsService } from './observability/providers/metrics.service';
import { randomUUID } from 'crypto';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  const httpLogger = new Logger('HTTP');
  const metricsService = app.get(MetricsService);
  const slowRequestMs = Number(process.env.REQUEST_SLOW_MS ?? 500);
  app.setGlobalPrefix('api');

  const rawBodyVerifier = (
    req: Request & { rawBody?: string },
    _: Response,
    buf: Buffer,
  ) => {
    if (req.originalUrl?.startsWith('/api/webhooks')) {
      req.rawBody = buf.toString('utf8');
    }
  };

  app.use(json({ verify: rawBodyVerifier }));
  app.use(urlencoded({ extended: true, verify: rawBodyVerifier }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production'
          ? {
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'", 'https:'],
                frameAncestors: ["'none'"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
              },
            }
          : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      frameguard: { action: 'deny' },
      noSniff: true,
      referrerPolicy: { policy: 'no-referrer' },
      hsts:
        process.env.NODE_ENV === 'production'
          ? {
              maxAge: 31536000,
              includeSubDomains: true,
              preload: true,
            }
          : false,
    }),
  );
  app.use((_: Request, res: Response, next: NextFunction) => {
    res.removeHeader('X-Powered-By');
    next();
  });
  app.use((req: Request, res: Response, next: NextFunction) => {
    const startTime = process.hrtime.bigint();
    const requestId =
      (req.headers['x-request-id'] as string | undefined)?.trim() ||
      randomUUID();
    res.setHeader('X-Request-Id', requestId);

    res.on('finish', () => {
      const durationMs =
        Number(process.hrtime.bigint() - startTime) / 1_000_000;
      const statusCode = res.statusCode;
      const method = req.method;
      const path = req.originalUrl || req.url;
      const ip = req.ip || req.socket.remoteAddress || 'unknown';

      metricsService.recordHttpRequest({
        method,
        route: path,
        statusCode,
        durationMs,
      });

      const logMessage = `${method} ${path} ${statusCode} ${durationMs.toFixed(1)}ms - ${ip} - reqId=${requestId}`;

      if (durationMs >= slowRequestMs && statusCode < 500) {
        httpLogger.warn(`Slow request (> ${slowRequestMs}ms): ${logMessage}`);
      } else if (statusCode >= 500) {
        httpLogger.error(logMessage);
      } else if (statusCode >= 400) {
        httpLogger.warn(logMessage);
      } else {
        httpLogger.log(logMessage);
      }
    });

    next();
  });

  const redisService = app.get(RedisService);
  const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900000);
  const rateLimitWindowSeconds = Math.max(
    1,
    Math.ceil(rateLimitWindowMs / 1000),
  );
  const defaultRateLimitMax = Number(process.env.RATE_LIMIT_MAX ?? 100);
  const authRateLimitMax = Number(
    process.env.RATE_LIMIT_AUTH_MAX ?? Math.min(defaultRateLimitMax, 30),
  );
  const paymentsRateLimitMax = Number(
    process.env.RATE_LIMIT_PAYMENTS_MAX ?? Math.min(defaultRateLimitMax, 40),
  );
  const returnsRateLimitMax = Number(
    process.env.RATE_LIMIT_RETURNS_MAX ?? Math.min(defaultRateLimitMax, 50),
  );
  const adminRateLimitMax = Number(
    process.env.RATE_LIMIT_ADMIN_MAX ?? Math.min(defaultRateLimitMax, 80),
  );

  const parseCookie = (
    cookieHeader: string | undefined,
    name: string,
  ): string | null => {
    if (!cookieHeader) {
      return null;
    }
    for (const part of cookieHeader.split(';')) {
      const [rawKey, ...rawValue] = part.trim().split('=');
      if (rawKey !== name) {
        continue;
      }
      return decodeURIComponent(rawValue.join('='));
    }
    return null;
  };

  const isUnsafeMethod = (method: string): boolean =>
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());

  const resolveRateLimitBucket = (
    path: string,
  ): { bucket: string; limit: number } => {
    if (path.startsWith('/api/auth/')) {
      return { bucket: 'auth', limit: authRateLimitMax };
    }
    if (path.startsWith('/api/payments/')) {
      return { bucket: 'payments', limit: paymentsRateLimitMax };
    }
    if (path.startsWith('/api/returns/')) {
      return { bucket: 'returns', limit: returnsRateLimitMax };
    }
    if (path.startsWith('/api/admin/')) {
      return { bucket: 'admin', limit: adminRateLimitMax };
    }
    return { bucket: 'default', limit: defaultRateLimitMax };
  };

  app.use((req: Request, res: Response, next: NextFunction) => {
    const path = req.originalUrl || req.url;
    const isApiRequest = path.startsWith('/api/');
    const exemptPaths = [
      '/api/auth/csrf',
      '/api/auth/register',
      '/api/auth/signIn',
      '/api/auth/verify-otp',
      '/api/auth/refresh',
      '/api/webhooks/',
    ];

    if (
      !isApiRequest ||
      !isUnsafeMethod(req.method) ||
      exemptPaths.some((prefix) => path.startsWith(prefix))
    ) {
      return next();
    }

    const cookieHeader = req.headers.cookie;
    const hasAuthCookie =
      !!parseCookie(cookieHeader, 'access_token') ||
      !!parseCookie(cookieHeader, 'refresh_token');

    if (!hasAuthCookie) {
      return next();
    }

    const csrfCookie = parseCookie(cookieHeader, 'csrf_token');
    const csrfHeaderRaw = req.headers['x-csrf-token'];
    const csrfHeader =
      typeof csrfHeaderRaw === 'string'
        ? csrfHeaderRaw
        : Array.isArray(csrfHeaderRaw)
          ? csrfHeaderRaw[0]
          : null;

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: 'CSRF token validation failed',
        timestamp: new Date().toISOString(),
        path,
      });
    }

    return next();
  });

  app.use(async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const isLocalIp =
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip === '::ffff:127.0.0.1' ||
      ip === 'localhost';
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment && isLocalIp) {
      return next();
    }

    const path = req.originalUrl || req.url;
    const { bucket, limit } = resolveRateLimitBucket(path);
    const rateLimitKey = `rate_limit:${bucket}:${ip}`;

    try {
      const count = await redisService.increment(rateLimitKey);

      if (count === 1) {
        await redisService.expire(rateLimitKey, rateLimitWindowSeconds);
      }

      const ttlSeconds = Math.max(1, await redisService.ttl(rateLimitKey));
      const resetAt = Math.ceil((Date.now() + ttlSeconds * 1000) / 1000);

      res.setHeader('X-RateLimit-Limit', String(limit));
      res.setHeader(
        'X-RateLimit-Remaining',
        String(Math.max(0, limit - count)),
      );
      res.setHeader('X-RateLimit-Reset', String(resetAt));

      if (count > limit) {
        const retryAfter = Math.max(1, ttlSeconds);
        res.setHeader('Retry-After', String(retryAfter));
        return res.status(429).json({
          success: false,
          statusCode: 429,
          message: 'Too many requests, please try again later.',
          timestamp: new Date().toISOString(),
          path: req.originalUrl,
        });
      }

      return next();
    } catch {
      // Fail-open when Redis is unavailable to avoid taking down API traffic.
      res.setHeader('X-RateLimit-Limit', String(defaultRateLimitMax));
      res.setHeader(
        'X-RateLimit-Remaining',
        String(defaultRateLimitMax - 1),
      );
      res.setHeader(
        'X-RateLimit-Reset',
        String(Math.ceil((Date.now() + rateLimitWindowMs) / 1000)),
      );
      return next();
    }
  });

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Digital Store API')
    .setDescription('API documentation for Digital Store backend')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('products', 'Product management endpoints')
    .addTag('orders', 'Order management endpoints')
    .addTag('payments', 'Payment processing endpoints')
    .addTag('reviews', 'Product reviews endpoints')
    .addTag('categories', 'Category management endpoints')
    .addTag('webhooks', 'Webhook handling endpoints')
    .addTag('health', 'Health and readiness endpoints')
    .addTag('admin', 'Admin dashboard and controls')
    .addTag('returns', 'Returns and refunds (RMA) endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const corsOriginsRaw = (process.env.CORS_ORIGINS ?? '').trim();
  const corsOrigins = corsOriginsRaw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowAllCors =
    corsOriginsRaw === '*' ||
    (process.env.NODE_ENV !== 'production' && corsOrigins.length === 0);

  app.enableCors({
    // `true` reflects request origin, which works with credentials and ngrok dev URLs.
    origin: allowAllCors ? true : corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'idempotency-key',
      'idempotency_key',
      'x-idempotency-key',
      'ngrok-skip-browser-warning',
    ],
  });
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/api/uploads/',
  });
  const port = Number(process.env.APP_PORT ?? process.env.PORT ?? 3000);
  await app.listen(port);
}
bootstrap();
