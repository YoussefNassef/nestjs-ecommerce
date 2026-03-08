import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { json, NextFunction, Request, Response, urlencoded } from 'express';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { RedisService } from './redis/providers/redis.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
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
        process.env.NODE_ENV === 'production' ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
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

  const redisService = app.get(RedisService);
  const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900000);
  const rateLimitWindowSeconds = Math.max(
    1,
    Math.ceil(rateLimitWindowMs / 1000),
  );
  const rateLimitMax = Number(process.env.RATE_LIMIT_MAX ?? 100);

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

    const rateLimitKey = `rate_limit:${ip}`;

    try {
      const count = await redisService.increment(rateLimitKey);

      if (count === 1) {
        await redisService.expire(rateLimitKey, rateLimitWindowSeconds);
      }

      const ttlSeconds = Math.max(1, await redisService.ttl(rateLimitKey));
      const resetAt = Math.ceil((Date.now() + ttlSeconds * 1000) / 1000);

      res.setHeader('X-RateLimit-Limit', String(rateLimitMax));
      res.setHeader(
        'X-RateLimit-Remaining',
        String(Math.max(0, rateLimitMax - count)),
      );
      res.setHeader('X-RateLimit-Reset', String(resetAt));

      if (count > rateLimitMax) {
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
      res.setHeader('X-RateLimit-Limit', String(rateLimitMax));
      res.setHeader('X-RateLimit-Remaining', String(rateLimitMax - 1));
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
