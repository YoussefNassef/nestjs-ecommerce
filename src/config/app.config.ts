import { registerAs } from '@nestjs/config';

export default registerAs('appConfig', () => ({
  port: Number(process.env.APP_PORT ?? process.env.PORT ?? 3000),
  environment: process.env.NODE_ENV || 'production',
  orderStockReservationMinutes: Number(
    process.env.ORDER_STOCK_RESERVATION_MINUTES ?? 15,
  ),
  slowRequestMs: Number(process.env.REQUEST_SLOW_MS ?? 500),
}));
