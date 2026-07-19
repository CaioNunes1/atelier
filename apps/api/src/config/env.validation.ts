import * as Joi from 'joi';

export const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3333),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  STORAGE_ENDPOINT: Joi.string().required(),
  STORAGE_ACCESS_KEY: Joi.string().required(),
  STORAGE_SECRET_KEY: Joi.string().required(),
  STORAGE_BUCKET: Joi.string().required(),
  MP_ACCESS_TOKEN: Joi.string().allow('', null),
  MP_WEBHOOK_SECRET: Joi.string().allow('', null),
  RESEND_API_KEY: Joi.string().allow('', null),
  WEB_URL: Joi.string().uri().default('http://localhost:5173'),
  ADMIN_URL: Joi.string().uri().default('http://localhost:5174'),
});