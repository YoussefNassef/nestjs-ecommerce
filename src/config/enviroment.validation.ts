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
  JWT_TOKEN_AUDIENCE: Joi.string().required(),
  JWT_TOKEN_ISSUER: Joi.string().required(),
  JWT_ACCESS_TOKEN_TTL: Joi.number().required(),
  REDIS_URL: Joi.string().uri().optional(),
  CART_TTL_SECONDS: Joi.number().integer().min(60).default(604800),
  CATALOG_CACHE_TTL_SECONDS: Joi.number().integer().min(10).default(60),
  MOYASAR_BASE_URL: Joi.string().uri().optional(),
  MOYASAR_SECRET_KEY: Joi.string().min(8).optional(),
  MOYASAR_WEBHOOK_SECRET: Joi.string().min(8).optional(),
  CORS_ORIGINS: Joi.string().optional(),
  RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).default(900000),
  RATE_LIMIT_MAX: Joi.number().integer().min(1).default(100),
  ORDER_STOCK_RESERVATION_MINUTES: Joi.number().integer().min(1).default(15),
});
