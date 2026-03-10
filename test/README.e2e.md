# Critical Flows E2E

This suite validates critical API flows against a running backend environment.

## Required env

- `E2E_BASE_URL` (example: `http://localhost:3000`)
- `E2E_USER_TOKEN`
- `E2E_ADMIN_TOKEN`

## Optional env (enable specific flows)

- `E2E_ADMIN_AUDIT_ORDER_ID`  
  Enables: admin add-note + read audit test.

- `E2E_TRACKING_ORDER_ID`  
  Enables: admin action (update delivery tracking) test.

- `E2E_PAYMENT_ORDER_ID`  
  Enables: payment idempotency test (`/api/payments/create`).

- `E2E_RETURN_ORDER_ID`  
  Enables: return creation flow test (`/api/returns`).

## Run

```powershell
$env:E2E_BASE_URL='http://localhost:3000'
$env:E2E_USER_TOKEN='PUT_USER_JWT'
$env:E2E_ADMIN_TOKEN='PUT_ADMIN_JWT'

# optional
$env:E2E_ADMIN_AUDIT_ORDER_ID='PUT_ORDER_UUID'
$env:E2E_TRACKING_ORDER_ID='PUT_ORDER_UUID'
$env:E2E_PAYMENT_ORDER_ID='PUT_PENDING_PAYMENT_ORDER_UUID'
$env:E2E_RETURN_ORDER_ID='PUT_DELIVERED_ORDER_UUID'

npm run test:e2e
```

## Notes

- If required env is missing, suite is skipped.
- Optional tests are skipped unless corresponding order IDs are provided.
- Use staging/test data; some flows create real records (notes/returns/payments).

