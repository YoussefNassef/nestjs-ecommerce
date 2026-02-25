# Digital Store Backend

Backend API for an e-commerce platform built with NestJS, TypeORM, and PostgreSQL.

## Overview
This project provides the core backend services for a digital store, including:
- OTP-based authentication
- Product management
- Cart operations
- Order lifecycle
- Payment integration (Moyasar)
- Webhook handling
- Product reviews

## Tech Stack
- NestJS 11
- TypeORM
- PostgreSQL
- JWT Authentication
- Swagger (OpenAPI)
- Joi (environment validation)

## Features
- Authentication with OTP (`/auth/signIn`, `/auth/verify-otp`)
- Role-based access (`user`, `admin`)
- Product CRUD
- Cart management (add/update/remove/clear)
- Order creation from cart
- Payment creation and webhook updates
- Product reviews (create/read/update/delete)

## Project Structure
```text
src/
  auth/
  users/
  products/
  cart/
  orders/
  payments/
  webhooks/
  reviews/
  config/
```

## Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL 14+

## Environment Variables
Create `.env.development` (or `.env` for production) with:

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

## Installation
```bash
npm install
```

## Running The App
```bash
# development
npm run start:dev

# debug
npm run start:debug

# production build
npm run build
npm run start:prod
```

## API Documentation (Swagger)
After starting the server, open:

`http://localhost:3000/api`

## Available Scripts
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
```

## Main API Modules
- `auth` - register, sign in, verify OTP
- `products` - product management
- `cart` - customer cart operations
- `orders` - create and track orders
- `payments` - payment creation
- `webhooks` - payment status callbacks
- `reviews` - product reviews

## Authentication
Most endpoints require Bearer token auth.

Use this header:
```http
Authorization: Bearer <access_token>
```

## Notes
- CORS currently allows: `http://localhost:3001`
- Entity loading is configured via TypeORM `autoLoadEntities`
- Schema sync behavior is controlled by `DATABASE_SYNC`

## Deployment Tips
- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Set `DATABASE_SYNC=false` in production
- Use managed PostgreSQL and proper secret management

## License
UNLICENSED
