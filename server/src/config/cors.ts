import { CorsOptions } from 'cors';
import { env } from './env';

function getAllowedOrigins(): (string | RegExp)[] {
  const origins: (string | RegExp)[] = [env.clientUrl];

  if (env.serverUrl && env.serverUrl !== env.clientUrl) {
    origins.push(env.serverUrl);
  }

  return origins;
}

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowed = getAllowedOrigins();
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400,
};
