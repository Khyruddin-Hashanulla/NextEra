import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const testEnvPath = path.resolve(__dirname, '../../.env.test');

if (fs.existsSync(testEnvPath)) {
  dotenv.config({ path: testEnvPath, override: false });
}

const defaults: Record<string, string> = {
  NODE_ENV: 'test',
  PORT: '5055',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/nextera_test',
  JWT_ACCESS_SECRET: 'test-access-secret-0123456789',
  JWT_REFRESH_SECRET: 'test-refresh-secret-0123456789',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  CSRF_SECRET: 'test-csrf-secret-0123456789abcdef0123456789abcdef',
  CERTIFICATE_SECRET: 'test-certificate-secret',
  CLIENT_URL: 'http://localhost:5173',
  SERVER_URL: 'http://localhost:5000',
  RAZORPAY_KEY_ID: 'rzp_test_key',
  RAZORPAY_KEY_SECRET: 'rzp_test_secret',
  RATE_LIMIT_MAX: '100000',
  RATE_LIMIT_WINDOW_MS: '900000',
  REDIS_CACHE_ENABLED: 'false',
  REDIS_URL: 'redis://localhost:6379',
};

for (const [key, value] of Object.entries(defaults)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}
