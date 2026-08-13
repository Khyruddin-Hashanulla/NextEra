import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { adminApi } from '@/api/endpoints/admin';

const recorded: string[] = [];

beforeAll(() => {
  server.resetHandlers(
    http.all(/\/api\/v1\/.*/, ({ request }) => {
      const url = new URL(request.url);
      recorded.push(url.pathname);
      if (/\/export\/|\/download|\/invoice/.test(url.pathname)) {
        return HttpResponse.arrayBuffer(new ArrayBuffer(8));
      }
      return HttpResponse.json({ data: {}, success: true });
    })
  );
});

afterEach(() => {
  recorded.length = 0;
});

afterAll(() => server.resetHandlers());

describe('adminApi endpoint sweep', () => {
  it.each(Object.entries(adminApi))('%s dispatches a request and resolves', async (_name, fn) => {
    const before = recorded.length;
    const result = await (fn as (...args: unknown[]) => Promise<unknown>)();
    expect(result).toBeDefined();
    expect(recorded.length).toBeGreaterThan(before);
  });
});
