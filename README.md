# Digital Store Backend

Production-ready e-commerce backend built with NestJS, PostgreSQL, TypeORM, and Redis.

## Overview

This service powers the core backend workflows of a digital commerce platform, including:

- OTP-based authentication and session management
- Product catalog and category management
- Cart, wishlist, reviews, and coupon workflows
- Order creation, pricing, tracking, and cancellation
- Payment initiation, reconciliation, callbacks, and webhook handling
- Returns management
- Notifications, address book, and admin analytics
- Health checks and Prometheus-style metrics

## Tech Stack

- NestJS 11
- TypeScript
- PostgreSQL
- TypeORM
- Redis
- Swagger / OpenAPI
- Jest + Supertest

## Architecture

The codebase follows a feature-first modular structure:

```text
src/
  auth/
  users/
  products/
  categories/
  cart/
  coupons/
  orders/
  payments/
  webhooks/
  returns/
  notifications/
  wishlist/
  reviews/
  addresses/
  admin/
  health/
  observability/
  redis/
  common/
  config/
```

Each module owns its controller, providers, DTOs, and domain entities where applicable.

## Core Capabilities

### Authentication

- User registration and sign-in via OTP
- Access and refresh session lifecycle
- Session listing and revocation
- CSRF token issuance for cookie-based authentication flows

Key endpoints:

- `POST /api/auth/register`
- `POST /api/auth/signIn`
- `POST /api/auth/verify-otp`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/csrf`
- `GET /api/auth/sessions`

### Catalog and Commerce

- Product CRUD and inventory operations
- Category management
- Wishlist and reviews
- Redis-backed cart with coupon support

### Orders and Fulfillment

- Order quote generation before checkout
- Order creation from cart
- User order history and order details
- Delivery tracking timeline
- Admin tracking updates

Key endpoints:

- `POST /api/orders`
- `POST /api/orders/quote`
- `GET /api/orders/me`
- `GET /api/orders/:id`
- `GET /api/orders/:id/tracking`
- `PATCH /api/orders/:id/tracking`
- `POST /api/orders/:id/cancel`

### Payments

- Moyasar payment creation
- Idempotent payment requests
- Payment callback handling
- Explicit sync and reconciliation for pending payments

Key endpoints:

- `POST /api/payments/moyasar`
- `POST /api/payments/create`
- `GET /api/payments/callback`
- `GET /api/payments/sync?id=...`
- `POST /api/payments/reconcile`

### Operations and Monitoring

- Liveness and readiness probes
- Prometheus-style metrics endpoint
- Structured request logging
- Rate limiting backed by Redis

Operational endpoints:

- `GET /api/health`
- `GET /api/health/ready`
- `GET /api/metrics`

## Authentication Model

The project uses a cookie-based authentication flow with CSRF protection.

After successful OTP verification, the API issues:

- `access_token` cookie
- `refresh_token` cookie
- `csrf_token` cookie

Authenticated unsafe requests require the `x-csrf-token` header to match the `csrf_token` cookie value.

This applies to:

- `POST`
- `PUT`
- `PATCH`
- `DELETE`

## Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL
- Redis
- npm

### Installation

```bash
npm install
```

### Environment Configuration

By default, the application loads `.env.development` unless `NODE_ENV=production`.

Typical required variables:

```env
APP_PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=digital_store
DATABASE_SYNC=false
DATABASE_AUTOLOAD=true

JWT_SECRET=change-me
JWT_REFRESH_SECRET=change-me-too
JWT_TOKEN_AUDIENCE=digital-store
JWT_TOKEN_ISSUER=digital-store-api
JWT_ACCESS_TOKEN_TTL=900
JWT_REFRESH_TOKEN_TTL=2592000

AUTHENTICA_SENDER=...
AUTHENTICA_API_KEY=...

REDIS_URL=redis://localhost:6379

MOYASAR_BASE_URL=https://api.moyasar.com
MOYASAR_SECRET_KEY=...
MOYASAR_WEBHOOK_SECRET=...
```

Additional runtime options are validated in [src/config/enviroment.validation.ts](/d:/Programming/E-Commerce/ecommerce-backend/src/config/enviroment.validation.ts).

### Run Commands

```bash
# development
npm run start:dev

# debug
npm run start:debug

# build
npm run build

# production
npm run start:prod
```

Default base URL:

```text
http://localhost:3000/api
```

Swagger UI:

```text
http://localhost:3000/api/docs
```

## Scripts

```bash
npm run build
npm run format
npm run lint
npm run start
npm run start:dev
npm run start:debug
npm run start:prod
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e
npm run seed
npm run load:smoke
npm run load:test
npm run load:stress
npm run load:soak
```

## Testing and Seed Data

Test assets are located under [`test/`](/d:/Programming/E-Commerce/ecommerce-backend/test).

Load tests are located under [`load-tests/`](/d:/Programming/E-Commerce/ecommerce-backend/load-tests).

To populate development data:

```bash
npm run seed
```

Seed entrypoint:
[src/scripts/seed.ts](/d:/Programming/E-Commerce/ecommerce-backend/src/scripts/seed.ts)

## Security and Runtime Notes

- `helmet` is enabled
- Global request validation is enforced
- Global response and exception handling are configured centrally
- Webhooks use raw-body verification
- Redis-backed rate limiting is applied across critical areas
- Request metrics are exposed for monitoring

Main bootstrap configuration:
[src/main.ts](/d:/Programming/E-Commerce/ecommerce-backend/src/main.ts)

## License

UNLICENSED
