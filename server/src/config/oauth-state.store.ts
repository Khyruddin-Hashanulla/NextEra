import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import type { Request } from 'express';
import type { Metadata, StateStoreStoreCallback, StateStoreVerifyCallback } from 'passport-oauth2';
import { env } from '../config/env';

interface StatePayload {
  nonce: string;
  redirect: string;
  exp: number;
}

const STATE_TTL_MS = 10 * 60 * 1000;

function sign(payload: string): string {
  return createHmac('sha256', env.csrfSecret).update(payload).digest('base64url');
}

function encode(token: string, payload: StatePayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${token}.${body}`;
}

function decode(value: string): { payload: StatePayload } | null {
  const [token, body] = value.split('.');
  if (!token || !body) return null;
  let payload: StatePayload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as StatePayload;
  } catch {
    return null;
  }
  return { payload };
}

function resolveCallbackUrl(req: Request, allowlist: string[]): string {
  const value = (req.query && req.query.redirect) || (req.body && req.body.redirect);
  if (!value || typeof value !== 'string') return `${env.clientUrl}/auth/callback`;
  try {
    const parsed = new URL(value);
    if (allowlist.some((u) => parsed.origin === new URL(u).origin)) {
      return value;
    }
  } catch {
    // fall through to default
  }
  return `${env.clientUrl}/auth/callback`;
}

function makePayload(req: Request, allowlist: string[]): { body: string; token: string; encoded: string } {
  const payload: StatePayload = {
    nonce: randomBytes(16).toString('hex'),
    redirect: resolveCallbackUrl(req, allowlist),
    exp: Date.now() + STATE_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const token = sign(body);
  return { body, token, encoded: encode(token, payload) };
}

export class OAuthStateStore {
  private readonly allowlist: string[] = [env.clientUrl];

  store(req: Request, callback: StateStoreStoreCallback): void;
  store(req: Request, meta: Metadata, callback: StateStoreStoreCallback): void;
  store(req: Request, metaOrCb: Metadata | StateStoreStoreCallback, maybeCb?: StateStoreStoreCallback): void {
    const callback = maybeCb === undefined ? (metaOrCb as StateStoreStoreCallback) : maybeCb;
    const made = makePayload(req, this.allowlist);
    callback(null, made.encoded);
  }

  verify(req: Request, state: string, callback: StateStoreVerifyCallback): void;
  verify(req: Request, state: string, meta: Metadata, callback: StateStoreVerifyCallback): void;
  verify(
    req: Request,
    state: string,
    metaOrCb: Metadata | StateStoreVerifyCallback,
    maybeCb?: StateStoreVerifyCallback
  ): void {
    const callback = maybeCb === undefined ? (metaOrCb as StateStoreVerifyCallback) : maybeCb;

    const decoded = decode(state);
    if (!decoded) return callback(null, false, { message: 'Invalid authorization request state.' });

    const { payload } = decoded;
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const expected = sign(body);
    const [token] = state.split('.');

    if (!token || !payload.nonce || typeof payload.exp !== 'number') {
      return callback(null, false, { message: 'Invalid authorization request state.' });
    }
    if (payload.exp < Date.now()) {
      return callback(null, false, { message: 'Authorization request state expired.' });
    }

    const a = Buffer.from(expected);
    const b = Buffer.from(token);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return callback(null, false, { message: 'Invalid authorization request state.' });
    }

    (req as any).oauthState = payload;
    callback(null, true, payload.redirect);
  }
}

export const oauthStateStore = new OAuthStateStore();
export const defaultOAuthRedirect = `${env.clientUrl}/auth/callback`;
