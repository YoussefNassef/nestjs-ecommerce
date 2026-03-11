import * as Joi from 'joi';

export default Joi.object({
  APP_PORT: Joi.number().port().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production', 'staging')
    .default('development'),
  DB_PORT: Joi.number().port().default(5432),
  DB_HOST: Joi.string().required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DATABASE_SYNC: Joi.boolean().required(),
  DATABASE_AUTOLOAD: Joi.boolean().required(),
  AUTHENTICA_SENDER: Joi.string().required(),
  AUTHENTICA_API_KEY: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().optional(),
  JWT_TOKEN_AUDIENCE: Joi.string().required(),
  JWT_TOKEN_ISSUER: Joi.string().required(),
  JWT_ACCESS_TOKEN_TTL: Joi.number().integer().min(60).default(900),
  JWT_REFRESH_TOKEN_TTL: Joi.number().integer().min(300).default(2592000),
  REDIS_URL: Joi.string().uri().optional(),
  CART_TTL_SECONDS: Joi.number().integer().min(60).default(604800),
  CATALOG_CACHE_TTL_SECONDS: Joi.number().integer().min(10).default(60),
  MOYASAR_BASE_URL: Joi.string().uri().optional(),
  MOYASAR_SECRET_KEY: Joi.string().min(8).optional(),
  MOYASAR_WEBHOOK_SECRET: Joi.string().min(8).optional(),
  CORS_ORIGINS: Joi.string().optional(),
  RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).default(900000),
  RATE_LIMIT_MAX: Joi.number().integer().min(1).default(100),
  RATE_LIMIT_AUTH_MAX: Joi.number().integer().min(1).default(30),
  RATE_LIMIT_PAYMENTS_MAX: Joi.number().integer().min(1).default(40),
  RATE_LIMIT_SUPPORT_MAX: Joi.number().integer().min(1).default(60),
  RATE_LIMIT_RETURNS_MAX: Joi.number().integer().min(1).default(50),
  RATE_LIMIT_ADMIN_MAX: Joi.number().integer().min(1).default(80),
  ORDER_STOCK_RESERVATION_MINUTES: Joi.number().integer().min(1).default(15),
  REQUEST_SLOW_MS: Joi.number().integer().min(1).default(500),
  DB_SLOW_QUERY_MS: Joi.number().integer().min(1).default(200),
  PAYMENT_RECONCILIATION_MIN_AGE_MINUTES: Joi.number()
    .integer()
    .min(1)
    .default(2),
  PAYMENT_RECONCILIATION_BATCH_SIZE: Joi.number()
    .integer()
    .min(1)
    .max(500)
    .default(50),
  LOW_STOCK_THRESHOLD: Joi.number().integer().min(0).default(5),
  LOW_STOCK_ALERT_COOLDOWN_MINUTES: Joi.number()
    .integer()
    .min(1)
    .default(120),
  INVENTORY_RECONCILIATION_ALERT_COOLDOWN_MINUTES: Joi.number()
    .integer()
    .min(1)
    .default(120),
});
