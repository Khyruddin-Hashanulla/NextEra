import fs from 'fs';
import path from 'path';
import { env } from '../../src/config/env';

const TEMP_DIR = path.resolve(__dirname, '../.tmp');

export default async function globalSetup(): Promise<void> {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  if (env.nodeEnv !== 'test') {
    throw new Error(`Expected NODE_ENV=test during tests, got "${env.nodeEnv}"`);
  }

  for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'CSRF_SECRET', 'CERTIFICATE_SECRET']) {
    if (!process.env[key]) {
      throw new Error(`Missing required test environment variable: ${key}`);
    }
  }
}
