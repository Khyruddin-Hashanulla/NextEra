import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GOOGLE_CALLBACK_URL: z.string().default('http://localhost:5000/api/v1/auth/google/callback'),

  CSRF_SECRET: z.string().min(32, 'CSRF_SECRET must be at least 32 characters'),

  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),

  RAZORPAY_KEY_ID: z.string().default(''),
  RAZORPAY_PAYOUT_ACCOUNT_NUMBER: z.string().default(''),
  RAZORPAY_KEY_SECRET: z.string().default(''),

  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  EMAIL_FROM: z.string().default('noreply@nextera.com'),
  SMTP_DEBUG: z.string().default('false'),

  CLIENT_URL: z.string().default('http://localhost:5173'),
  SERVER_URL: z.string().optional(),
  COOKIE_DOMAIN: z.string().optional(),

  ZOOM_ACCOUNT_ID: z.string().default(''),
  ZOOM_CLIENT_ID: z.string().default(''),
  ZOOM_CLIENT_SECRET: z.string().default(''),
  ZOOM_WEBHOOK_SECRET: z.string().default(''),

  CERTIFICATE_SECRET: z.string().min(1, 'CERTIFICATE_SECRET is required'),

  OPENAI_API_KEY: z.string().default(''),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().default(''),
  REDIS_DB: z.coerce.number().default(0),
  REDIS_TLS: z.string().default('false'),
  REDIS_KEY_PREFIX: z.string().default('nextera:'),
  REDIS_CACHE_ENABLED: z.string().default('true'),
  REDIS_CONNECT_TIMEOUT_MS: z.coerce.number().default(5000),
  REDIS_MAX_RETRIES_PER_REQUEST: z.coerce.number().default(1),
  REDIS_COMPRESSION_ENABLED: z.string().default('true'),
  REDIS_COMPRESSION_THRESHOLD_BYTES: z.coerce.number().default(2048),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  const errors = parsed.error.flatten().fieldErrors;
  for (const [key, messages] of Object.entries(errors)) {
    console.error(`  - ${key}: ${messages?.join(', ')}`);
  }
  process.exit(1);
}

const raw = parsed.data;

const isProduction = raw.NODE_ENV === 'production';

function requireHttpsUrl(value: string, name: string): void {
  if (isProduction && !value.startsWith('https://')) {
    console.error(`${name} must use HTTPS in production. Current value: ${value}`);
    process.exit(1);
  }
}

requireHttpsUrl(raw.CLIENT_URL, 'CLIENT_URL');
if (raw.SERVER_URL) {
  requireHttpsUrl(raw.SERVER_URL, 'SERVER_URL');
}

export const env = {
  nodeEnv: raw.NODE_ENV,
  port: raw.PORT,
  mongodbUri: raw.MONGODB_URI,

  jwtAccessSecret: raw.JWT_ACCESS_SECRET,
  jwtRefreshSecret: raw.JWT_REFRESH_SECRET,
  jwtAccessExpiresIn: raw.JWT_ACCESS_EXPIRES_IN,
  jwtRefreshExpiresIn: raw.JWT_REFRESH_EXPIRES_IN,

  googleClientId: raw.GOOGLE_CLIENT_ID,
  googleClientSecret: raw.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl: raw.GOOGLE_CALLBACK_URL,

  csrfSecret: raw.CSRF_SECRET,

  cloudinaryCloudName: raw.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: raw.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: raw.CLOUDINARY_API_SECRET,

  razorpayKeyId: raw.RAZORPAY_KEY_ID,
  razorpayKeySecret: raw.RAZORPAY_KEY_SECRET,
  razorpayPayoutAccountNumber: raw.RAZORPAY_PAYOUT_ACCOUNT_NUMBER,

  smtpHost: raw.SMTP_HOST,
  smtpPort: raw.SMTP_PORT,
  smtpUser: raw.SMTP_USER,
  smtpPass: raw.SMTP_PASS,
  emailFrom: raw.EMAIL_FROM,
  smtpDebug: raw.SMTP_DEBUG === 'true',

  clientUrl: raw.CLIENT_URL,
  serverUrl: raw.SERVER_URL,
  cookieDomain: raw.COOKIE_DOMAIN,

  zoomAccountId: raw.ZOOM_ACCOUNT_ID,
  zoomClientId: raw.ZOOM_CLIENT_ID,
  zoomClientSecret: raw.ZOOM_CLIENT_SECRET,
  zoomWebhookSecret: raw.ZOOM_WEBHOOK_SECRET,

  certificateSecret: raw.CERTIFICATE_SECRET,

  openaiApiKey: raw.OPENAI_API_KEY,
  openaiModel: raw.OPENAI_MODEL,

  rateLimitWindowMs: raw.RATE_LIMIT_WINDOW_MS,
  rateLimitMax: raw.RATE_LIMIT_MAX,

  redisUrl: raw.REDIS_URL,
  redisPassword: raw.REDIS_PASSWORD,
  redisDb: raw.REDIS_DB,
  redisTls: raw.REDIS_TLS === 'true',
  redisKeyPrefix: raw.REDIS_KEY_PREFIX,
  redisCacheEnabled: raw.REDIS_CACHE_ENABLED !== 'false',
  redisConnectTimeoutMs: raw.REDIS_CONNECT_TIMEOUT_MS,
  redisMaxRetriesPerRequest: raw.REDIS_MAX_RETRIES_PER_REQUEST,
  redisCompressionEnabled: raw.REDIS_COMPRESSION_ENABLED !== 'false',
  redisCompressionThresholdBytes: raw.REDIS_COMPRESSION_THRESHOLD_BYTES,
};
