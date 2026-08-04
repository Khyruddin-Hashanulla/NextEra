import fs from 'fs';
import path from 'path';

const TEMP_DIR = path.resolve(__dirname, '../.tmp');

export default async function globalTeardown(): Promise<void> {
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
}
