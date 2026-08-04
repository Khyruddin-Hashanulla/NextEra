process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';

process.env.MONGODB_URI =
  process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/nextera_test';

process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'test-access-secret-0123456789';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-0123456789';
process.env.JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';

process.env.CSRF_SECRET =
  process.env.CSRF_SECRET ??
  'test-csrf-secret-0123456789abcdef0123456789abcdef';

process.env.CERTIFICATE_SECRET =
  process.env.CERTIFICATE_SECRET ?? 'test-certificate-secret';

process.env.CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';
process.env.SERVER_URL = process.env.SERVER_URL ?? 'http://localhost:5000';

process.env.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX ?? '100000';
process.env.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS ?? '900000';

process.env.REDIS_CACHE_ENABLED = process.env.REDIS_CACHE_ENABLED ?? 'false';
process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
