# Digital Store Backend

<p align="center">
  Backend API for a production-oriented e-commerce workflow using NestJS, PostgreSQL, and TypeORM.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11-red" alt="NestJS 11" />
  <img src="https://img.shields.io/badge/Node.js-20%2B-339933" alt="Node 20+" />
  <img src="https://img.shields.io/badge/PostgreSQL-14%2B-336791" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Auth-JWT%20%2B%20OTP-blue" alt="JWT OTP" />
  <img src="https://img.shields.io/badge/API-Swagger-85EA2D" alt="Swagger" />
</p>

## Table of Contents
- [Overview](#overview)
- [Core Capabilities](#core-capabilities)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [API Surface](#api-surface)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Run Commands](#run-commands)
- [Authentication](#authentication)
- [Quick API Examples](#quick-api-examples)
- [Operational Notes](#operational-notes)
- [Production Checklist](#production-checklist)
- [License](#license)

## Overview
Digital Store Backend is a modular NestJS application that handles the core domain of an online store:
- user onboarding and OTP login
- product catalog administration
- cart and checkout preparation
- order creation and tracking
- payment initiation and webhook updates
- customer product reviews

The codebase follows a feature-first module structure and provider-based service orchestration.

## Core Capabilities
- OTP-based authentication flow (`signIn` -> `verify-otp`)
- JWT-protected endpoints with role-based access (`user`, `admin`)
- Product CRUD for admin workflows
- Cart lifecycle: add, update quantity, remove item, clear cart
- Order creation from cart snapshot
- Payment creation endpoint and webhook processing
- Reviews module with create/read/update/delete operations

## Architecture
```text
src/
  app.module.ts
  main.ts
  auth/        # guards, decorators, OTP, JWT
  users/       # user entity + providers
  products/    # product entity + CRUD
  cart/        # cart aggregate and item operations
  orders/      # order aggregate and mapping
  payments/    # payment creation and status updates
  webhooks/    # external callback handling
  reviews/     # product reviews (CRUD + stats)
  config/      # app/database/env validation
```

## Tech Stack
| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | NestJS 11 |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | TypeORM |
| Validation | class-validator + Joi |
| Auth | JWT + OTP |
| API Docs | Swagger/OpenAPI |
| Testing | Jest + Supertest |

## API Surface
| Module | Base Path | Purpose |
|---|---|---|
| Auth | `/auth` | Register, sign in, verify OTP |
| Products | `/products` | Product management |
| Cart | `/cart` | Customer cart operations |
| Orders | `/orders` | Order creation and retrieval |
| Payments | `/payments` | Payment requests |
| Webhooks | `/webhooks` | Payment callbacks |
| Reviews | `/reviews` | Product review lifecycle |

Swagger UI is available at:

`http://localhost:3000/api`

## Getting Started
### 1. Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL 14+

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
Create `.env.development` for local development.

### 4. Start development server
```bash
npm run start:dev
```

### 5. Open API docs
Visit `http://localhost:3000/api`.

## Environment Variables
Required configuration keys:

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=digital_store
DATABASE_SYNC=true
DATABASE_AUTOLOAD=true

AUTHENTICA_SENDER=your_sender_name
AUTHENTICA_API_KEY=your_authentica_api_key

JWT_SECRET=super_secret_key
JWT_TOKEN_AUDIENCE=digital-store-users
JWT_TOKEN_ISSUER=digital-store-api
JWT_ACCESS_TOKEN_TTL=3600
```

## Run Commands
```bash
# build
npm run build

# local
npm run start
npm run start:dev
npm run start:debug

# production
npm run start:prod

# quality
npm run lint
npm run format

# tests
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e
```

## Authentication
Most endpoints require Bearer authentication.

```http
Authorization: Bearer <access_token>
```

Public endpoints are explicitly marked with `AuthType.None` in the codebase.

## Quick API Examples
### Register
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "phone": "966512345678"
  }'
```

### Request OTP
```bash
curl -X POST http://localhost:3000/auth/signIn \
  -H "Content-Type: application/json" \
  -d '{"phone":"966512345678"}'
```

### Create Review (Authenticated)
```bash
curl -X POST http://localhost:3000/reviews \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId":"550e8400-e29b-41d4-a716-446655440000",
    "rating":5,
    "comment":"Excellent quality"
  }'
```

## Operational Notes
- CORS is currently configured for `http://localhost:3001`.
- Entity registration uses TypeORM `autoLoadEntities`.
- Schema synchronization is controlled by `DATABASE_SYNC`.
- API docs are generated from decorators and DTO schemas.

## Production Checklist
- Set `NODE_ENV=production`.
- Use strong and rotated `JWT_SECRET`.
- Set `DATABASE_SYNC=false`.
- Use managed secrets (not plaintext env files in CI/CD).
- Enforce HTTPS behind reverse proxy/load balancer.
- Restrict CORS to trusted frontend domains.
- Add centralized logging and health checks.

## License
UNLICENSED
