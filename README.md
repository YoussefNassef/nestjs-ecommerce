# Digital Store Backend

Production-oriented e-commerce backend built with NestJS, PostgreSQL, and TypeORM.

<p>
  <img src="https://img.shields.io/badge/NestJS-11-red" alt="NestJS 11" />
  <img src="https://img.shields.io/badge/Node.js-20%2B-339933" alt="Node 20+" />
  <img src="https://img.shields.io/badge/PostgreSQL-14%2B-336791" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/ORM-TypeORM-4479A1" alt="TypeORM" />
  <img src="https://img.shields.io/badge/Auth-JWT%20%2B%20OTP-blue" alt="JWT + OTP" />
  <img src="https://img.shields.io/badge/API-Swagger-85EA2D" alt="Swagger" />
</p>

## Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [API Map](#api-map)
- [Recent Domain Enhancements](#recent-domain-enhancements)
- [Typical Workflows](#typical-workflows)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Available Commands](#available-commands)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Example Requests](#example-requests)
- [Operational Notes](#operational-notes)
- [Production Checklist](#production-checklist)
- [License](#license)

## Overview
This service powers the core commerce flow:
- authentication with OTP + JWT
- product, category, cart, coupon, wishlist, and review workflows
- order lifecycle and delivery tracking
- payment lifecycle with webhook handling
- notifications and admin analytics
- returns and refunds request lifecycle (RMA)

The codebase follows feature-first NestJS modules with provider-based orchestration.

## Key Features
### Commerce
- Product CRUD for admin
- Categories, coupons, wishlist, reviews
- Cart with Redis-backed storage and coupon application
- Order creation with stock reservation flow

### Fulfillment
- Delivery tracking updates (`PATCH /orders/:id/tracking`)
- Tracking timeline events (admin/system actors)
- Customer tracking endpoint with current state + full timeline

### Payments
- Payment initiation and callback sync
- Webhook signature validation and idempotency handling
- Safe status transitions to avoid duplicate processing

### Returns (RMA)
- Customer return request creation for delivered orders
- Admin return approval/rejection/refund-state workflow
- Controlled transition rules across return statuses

### Platform
- Role-based authorization (`user`, `admin`)
- Global validation, global response shape, and exception filter
- Rate limiting (Redis-backed, fail-open strategy)
- Swagger documentation generation

## Architecture
```text
src/
  app.module.ts
  main.ts
  auth/
  users/
  products/
  categories/
  cart/
  coupons/
  wishlist/
  reviews/
  orders/
  payments/
  webhooks/
  notifications/
  addresses/
  admin/
  returns/
  redis/
  config/
```

## Tech Stack
| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Framework | NestJS 11 |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | TypeORM |
| Cache / Rate Limiting | Redis |
| Validation | class-validator + Joi |
| Auth | JWT + OTP |
| API Docs | Swagger/OpenAPI |
| Testing | Jest + Supertest |

## API Map
Global prefix: `/api`

| Module | Path | Notes |
|---|---|---|
| Auth | `/auth` | register, sign in, verify OTP |
| Users | `/users` | profile and phone update flows |
| Products | `/products` | product catalog and admin CRUD |
| Categories | `/categories` | category management |
| Cart | `/cart` | cart lifecycle |
| Coupons | `/coupons` | coupon administration and usage |
| Orders | `/orders` | order lifecycle + tracking |
| Payments | `/payments` | payment creation and status sync |
| Webhooks | `/webhooks` | payment webhooks |
| Returns | `/returns` | RMA (customer + admin flows) |
| Notifications | `/notifications` | user/admin notifications |
| Wishlist | `/wishlist` | wishlist operations |
| Reviews | `/reviews` | product reviews |
| Admin | `/admin` | analytics and management endpoints |
| Health | `/health` | liveness/readiness |

Swagger UI:
- `http://localhost:3000/api/docs`

## Recent Domain Enhancements
### 1. Delivery Tracking Timeline
- Added persistent tracking events (`order_tracking_events`)
- Timeline now includes actor metadata (`admin` or `system`)
- `GET /orders/:id/tracking` returns current delivery snapshot + chronological timeline

### 2. Returns & Refund Requests (RMA)
- Added return request lifecycle entity (`return_requests`)
- Customer endpoints:
  - `POST /returns`
  - `GET /returns/me`
  - `PATCH /returns/:id/cancel`
- Admin endpoints:
  - `GET /returns?status=...`
  - `PATCH /returns/:id/status`

## Typical Workflows
### Checkout and payment
1. Customer builds cart in Redis-backed cart storage.
2. Customer creates order from cart snapshot.
3. Payment is initiated through `/payments/moyasar`.
4. Callback or webhook updates payment status and then order status.

### Delivery tracking
1. Admin updates delivery state through `/orders/:id/tracking`.
2. Backend persists the latest tracking snapshot on the order.
3. Backend appends a timeline event with actor metadata.
4. Customer reads the full timeline from `GET /orders/:id/tracking`.

### Returns and refunds request flow
1. Customer submits `POST /returns` for a delivered order.
2. Request starts in `requested`.
3. Admin moves it through `approved`, `refund_initiated`, and `refunded`, or rejects it.
4. Customer can cancel only while the request is still `requested`.

## Quick Start
### 1. Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL 14+
- Redis 7+ for cart, cache, and rate-limit parity in local development

### 2. Install
```bash
npm install
```

### 3. Configure environment
Create `.env.development`.

### 4. Run development server
```bash
npm run start:dev
```

### 5. Verify API docs
Open:
- `http://localhost:3000/api/docs`

## Environment Variables
The app validates env values using Joi (`src/config/enviroment.validation.ts`).

### Required
```env
NODE_ENV=development
APP_PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=digital_store
DATABASE_SYNC=true
DATABASE_AUTOLOAD=true

AUTHENTICA_SENDER=your_sender
AUTHENTICA_API_KEY=your_authentica_api_key

JWT_SECRET=change_me
JWT_TOKEN_AUDIENCE=digital-store-users
JWT_TOKEN_ISSUER=digital-store-api
JWT_ACCESS_TOKEN_TTL=3600
```

### Optional but recommended
```env
REDIS_URL=redis://localhost:6379
CART_TTL_SECONDS=604800
CATALOG_CACHE_TTL_SECONDS=60
ORDER_STOCK_RESERVATION_MINUTES=15

MOYASAR_BASE_URL=https://api.moyasar.com/v1
MOYASAR_SECRET_KEY=your_moyasar_secret
MOYASAR_WEBHOOK_SECRET=your_moyasar_webhook_secret

CORS_ORIGINS=http://localhost:4200,http://localhost:3001
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## Available Commands
```bash
# Build
npm run build

# Run
npm run start
npm run start:dev
npm run start:debug
npm run start:prod

# Quality
npm run lint
npm run format

# Tests
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e

# Seed
npm run seed
```

## Authentication
Most endpoints require Bearer token:

```http
Authorization: Bearer <access_token>
```

Public endpoints are explicitly marked with `AuthType.None`.

## Response Format
Successful responses are wrapped by the global response interceptor:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request successful",
  "data": {},
  "timestamp": "2026-03-08T12:00:00.000Z",
  "path": "/api/example"
}
```

Error responses are normalized by the global exception filter:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [],
  "timestamp": "2026-03-08T12:00:00.000Z",
  "path": "/api/example"
}
```

## Example Requests
### Register user
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "phone": "966512345678"
  }'
```

### Request OTP
```bash
curl -X POST http://localhost:3000/api/auth/signIn \
  -H "Content-Type: application/json" \
  -d '{"phone":"966512345678"}'
```

### Create return request (authenticated)
```bash
curl -X POST http://localhost:3000/api/returns \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId":"550e8400-e29b-41d4-a716-446655440000",
    "reason":"damaged",
    "reasonDetails":"Package arrived damaged"
  }'
```

### Get order tracking with timeline
```bash
curl -X GET http://localhost:3000/api/orders/550e8400-e29b-41d4-a716-446655440000/tracking \
  -H "Authorization: Bearer <access_token>"
```

## Operational Notes
- TypeORM uses `autoLoadEntities`.
- Schema sync is controlled by `DATABASE_SYNC`.
- Redis is effectively part of the app runtime for cart and cache-backed flows.
- Rate limiting is Redis-backed with fail-open behavior.
- API responses are normalized through a global response interceptor.
- The repository currently relies on schema synchronization in development; migration scripts are not wired yet.

## Production Checklist
- Set `NODE_ENV=production`.
- Introduce a migration workflow before disabling `DATABASE_SYNC`.
- Use strong secrets for JWT and payment/webhook keys.
- Restrict CORS to trusted domains only.
- Run behind HTTPS and reverse proxy.
- Use centralized logs/monitoring and alerting.

## License
UNLICENSED
