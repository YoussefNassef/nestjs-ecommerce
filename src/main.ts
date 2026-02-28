import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { NextFunction, Request, Response } from 'express';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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

  const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900000);
  const rateLimitMax = Number(process.env.RATE_LIMIT_MAX ?? 100);
  const rateLimitStore = new Map<string, RateLimitEntry>();

  setInterval(
    () => {
      const now = Date.now();
      for (const [ip, entry] of rateLimitStore.entries()) {
        if (entry.resetAt <= now) {
          rateLimitStore.delete(ip);
        }
      }
    },
    Math.min(rateLimitWindowMs, 60000),
  ).unref();

  app.use((req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const existingEntry = rateLimitStore.get(ip);

    if (!existingEntry || existingEntry.resetAt <= now) {
      rateLimitStore.set(ip, {
        count: 1,
        resetAt: now + rateLimitWindowMs,
      });
      res.setHeader('X-RateLimit-Limit', String(rateLimitMax));
      res.setHeader('X-RateLimit-Remaining', String(rateLimitMax - 1));
      res.setHeader(
        'X-RateLimit-Reset',
        String(Math.ceil((now + rateLimitWindowMs) / 1000)),
      );
      return next();
    }

    if (existingEntry.count >= rateLimitMax) {
      const retryAfter = Math.max(
        1,
        Math.ceil((existingEntry.resetAt - now) / 1000),
      );
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        message: 'Too many requests, please try again later.',
      });
    }

    existingEntry.count += 1;
    rateLimitStore.set(ip, existingEntry);
    res.setHeader('X-RateLimit-Limit', String(rateLimitMax));
    res.setHeader(
      'X-RateLimit-Remaining',
      String(Math.max(0, rateLimitMax - existingEntry.count)),
    );
    res.setHeader(
      'X-RateLimit-Reset',
      String(Math.ceil(existingEntry.resetAt / 1000)),
    );
    return next();
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
    .addTag('webhooks', 'Webhook handling endpoints')
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
  SwaggerModule.setup('api', app, document);

  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (process.env.NODE_ENV !== 'production' && corsOrigins.length === 0) {
    corsOrigins.push('http://localhost:3001');
  }
  if (process.env.NODE_ENV === 'production' && corsOrigins.length === 0) {
    throw new Error('CORS_ORIGINS must be set in production');
  }

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
