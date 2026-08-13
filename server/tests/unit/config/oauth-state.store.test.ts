import { OAuthStateStore } from '../../../src/config/oauth-state.store';
import { env } from '../../../src/config/env';

const store = new OAuthStateStore();

function makeReq(redirect?: string): any {
  return { query: redirect ? { redirect } : {}, body: {} };
}

describe('OAuthStateStore', () => {
  it('issues a signed, self-contained state token', () => {
    let issued: string | undefined;
    store.store(makeReq(), undefined, (err, state) => {
      expect(err).toBeNull();
      issued = state;
    });

    expect(issued).toBeTruthy();
    const parts = issued!.split('.');
    expect(parts).toHaveLength(2);
    expect(parts[0]).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('verifies a genuine token and passes the resumable redirect', () => {
    let issued: string | undefined;
    store.store(makeReq(`${env.clientUrl}/auth/callback?plan=pro`), undefined, (_e, s) => (issued = s));

    let ok = false;
    let redirect: unknown;
    store.verify(makeReq(), issued!, (_err, result, info) => {
      ok = result;
      redirect = info;
    });

    expect(ok).toBe(true);
    expect(redirect).toBe(`${env.clientUrl}/auth/callback?plan=pro`);
  });

  it('rejects a tampered token', () => {
    let issued: string | undefined;
    store.store(makeReq(), undefined, (_e, s) => (issued = s));

    const [token, body] = issued!.split('.');
    const tampered = `${token}x.${body}`;

    let ok = true;
    store.verify(makeReq(), tampered, (_err, result) => (ok = result));
    expect(ok).toBe(false);
  });

  it('rejects a truncated / malformed token', () => {
    let ok = true;
    store.verify(makeReq(), 'not-a-real-token', (_err, result) => (ok = result));
    expect(ok).toBe(false);
  });

  it('rejects an expired token', () => {
    let issued: string | undefined;
    store.store(makeReq(), undefined, (_e, s) => (issued = s));

    const [token, body] = issued!.split('.');
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    payload.exp = Date.now() - 1000;
    const expiredBody = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const expired = `${token}.${expiredBody}`;

    let ok = true;
    store.verify(makeReq(), expired, (_err, result) => (ok = result));
    expect(ok).toBe(false);
  });

  it('falls back to the default callback when redirect is not allowlisted', () => {
    let issued: string | undefined;
    store.store(makeReq('https://evil.example.com/phish'), undefined, (_e, s) => (issued = s));

    let redirect: unknown;
    store.verify(makeReq(), issued!, (_err, _ok, info) => (redirect = info));
    expect(redirect).toBe(`${env.clientUrl}/auth/callback`);
  });
});
