import request from 'supertest';
import { createApp } from '../../app';
import {
  connectTestDb,
  disconnectTestDb,
  clearDb,
} from '../../test/helpers/db.helper';
import { TestRequest } from '../../test/helpers/request.helper';

describe('App smoke test', () => {
  const app = createApp();

  beforeAll(async () => {
    await connectTestDb();
    await clearDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('serves the health endpoint with memory cache fallback', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.cache.mode).toBe('memory');
  });

  it('issues a CSRF token', async () => {
    const res = await request(app).get('/api/v1/csrf-token');
    expect(res.status).toBe(200);
    expect(res.body.data.csrfToken).toBeTruthy();
  });

  it('serves the public course list through the full middleware chain', async () => {
    const api = new TestRequest(app);
    await api.fetchCsrfToken();

    const res = await api.get('/api/v1/courses/all');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.courses)).toBe(true);
  });
});
