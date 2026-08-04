import request from 'supertest';
import type { Application } from 'express';

export class TestRequest {
  readonly agent: ReturnType<typeof request.agent>;

  private csrfToken = '';

  constructor(app: Application) {
    this.agent = request.agent(app);
  }

  private authHeaders(token?: string): Record<string, string> {
    return {
      'x-csrf-token': this.csrfToken,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async fetchCsrfToken(): Promise<string> {
    const res = await this.agent.get('/api/v1/csrf-token');
    this.csrfToken = res.body?.data?.csrfToken ?? '';
    return this.csrfToken;
  }

  get(path: string, token?: string) {
    return this.agent.get(path).set(this.authHeaders(token));
  }

  post(path: string, token?: string) {
    return this.agent.post(path).set(this.authHeaders(token));
  }

  put(path: string, token?: string) {
    return this.agent.put(path).set(this.authHeaders(token));
  }

  patch(path: string, token?: string) {
    return this.agent.patch(path).set(this.authHeaders(token));
  }

  delete(path: string, token?: string) {
    return this.agent.delete(path).set(this.authHeaders(token));
  }
}
