# API Load Testing Guide (k6)

This guide helps you answer one question with numbers:
`Can the backend handle expected traffic?`

## Prerequisites
- Backend running (default: `http://localhost:3000/api`)
- `k6` installed
  - Windows (choco): `choco install k6`
  - macOS (brew): `brew install k6`
  - Linux: https://k6.io/docs/get-started/installation/

## Test Script
- Script path: `load-tests/api-load.k6.js`

## Covered Endpoints

### Default read-only coverage
- `GET /products`
- `GET /products/:id`
- `GET /cart`
- `POST /cart/validate`
- `GET /addresses`
- `GET /orders/me`
- `GET /notifications`
- `GET /notifications/unread-count`
- `GET /returns/me`
- `GET /admin/dashboard/overview`
- `GET /returns` (admin)
- `GET /products/:id/stock-adjustments` (admin)

### Optional coverage
- `POST /orders/quote`
- `GET /orders/:id/tracking`

### Optional write coverage
- `POST /cart/add`
- `PATCH /cart/item/:id`
- `DELETE /cart/item/:id`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/mark-all-read`
- `POST /returns`

## Environment Variables
- `BASE_URL` default: `http://localhost:3000/api`
- `USER_TOKEN` required for user endpoints
- `ADMIN_TOKEN` required for admin endpoints
- `PRODUCT_ID` optional (for product detail and stock movement list)
- `CART_PRODUCT_ID` optional (for cart mutation flow)
- `ORDER_ID` optional (for tracking endpoint)
- `RETURN_ORDER_ID` optional (for return creation flow)
- `ADDRESS_ID` optional (for quote endpoint)
- `SHIPPING_METHOD` optional default: `standard`
- `ENABLE_ADMIN` default: `true`
- `ENABLE_QUOTE` default: `false`
- `ENABLE_TRACKING` default: `false`
- `ENABLE_MUTATIONS` default: `false`
- `ENABLE_NOTIFICATION_MUTATIONS` default: `false`
- `ENABLE_RETURN_MUTATIONS` default: `false`
- `ENABLE_CART_MUTATIONS` default: `false`

## Run Examples

### 1) Smoke (quick sanity)
```powershell
$env:BASE_URL='http://localhost:3000/api'
$env:USER_TOKEN='PUT_USER_JWT_HERE'
$env:ADMIN_TOKEN='PUT_ADMIN_JWT_HERE'
npm run load:smoke
```

### 2) Default Load Profile (recommended)
```powershell
$env:BASE_URL='http://localhost:3000/api'
$env:USER_TOKEN='PUT_USER_JWT_HERE'
$env:ADMIN_TOKEN='PUT_ADMIN_JWT_HERE'
npm run load:test
```

### 3) Enable quote + tracking in same run
```powershell
$env:BASE_URL='http://localhost:3000/api'
$env:USER_TOKEN='PUT_USER_JWT_HERE'
$env:ADMIN_TOKEN='PUT_ADMIN_JWT_HERE'
$env:ENABLE_QUOTE='true'
$env:ENABLE_TRACKING='true'
$env:ADDRESS_ID='PUT_ADDRESS_UUID'
$env:ORDER_ID='PUT_ORDER_UUID'
npm run load:test
```

### 4) Enable mutation flows carefully
Use this only on staging or test data.
```powershell
$env:BASE_URL='http://localhost:3000/api'
$env:USER_TOKEN='PUT_USER_JWT_HERE'
$env:ADMIN_TOKEN='PUT_ADMIN_JWT_HERE'
$env:ENABLE_MUTATIONS='true'
$env:ENABLE_CART_MUTATIONS='true'
$env:CART_PRODUCT_ID='PUT_PRODUCT_UUID'
npm run load:test
```

### 5) Stress test
```powershell
$env:BASE_URL='http://localhost:3000/api'
$env:USER_TOKEN='PUT_USER_JWT_HERE'
$env:ADMIN_TOKEN='PUT_ADMIN_JWT_HERE'
npm run load:stress
```

### 6) Soak test
```powershell
$env:BASE_URL='http://localhost:3000/api'
$env:USER_TOKEN='PUT_USER_JWT_HERE'
$env:ADMIN_TOKEN='PUT_ADMIN_JWT_HERE'
npm run load:soak
```

### 7) Export report file
```powershell
$env:BASE_URL='http://localhost:3000/api'
$env:USER_TOKEN='PUT_USER_JWT_HERE'
$env:ADMIN_TOKEN='PUT_ADMIN_JWT_HERE'
k6 run --summary-export=load-tests/summary.json load-tests/api-load.k6.js
```

## Pass/Fail Criteria (built into thresholds)
- Global:
  - `http_req_failed < 1%`
  - `p95 < 900ms`
  - `p99 < 1800ms`
- Endpoint p95:
  - `products_list < 500ms`
  - `product_detail < 500ms`
  - `cart_get < 600ms`
  - `cart_validate < 700ms`
  - `addresses_list < 600ms`
  - `orders_me < 700ms`
  - `notifications_list < 700ms`
  - `notifications_unread_count < 500ms`
  - `returns_me < 700ms`
  - `admin_overview < 900ms`
  - `admin_returns_list < 900ms`
  - `stock_adjustments_list < 900ms`
  - `orders_quote < 900ms` (when enabled)
  - `order_tracking < 900ms` (when enabled)

## How to Decide if System Can Handle Load
1. Run smoke test (quick validation).
2. Run default load profile.
3. Check:
   - Threshold pass/fail
   - p95/p99 latency
   - error rate
4. If failed:
   - inspect slow endpoints first
   - inspect DB slow queries / connection pool
   - retest with same scenario after fixes.

## Notes
- If tokens are missing, related scenario iterations will be skipped.
- Default profile is read-heavy and safe for repeated runs.
- Mutation flows should run only on staging or controlled test data.
- For production-like testing, run against a staging environment similar to production infra.
