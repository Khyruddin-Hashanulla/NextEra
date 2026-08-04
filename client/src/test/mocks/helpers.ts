import { http, HttpResponse } from 'msw';

export function jsonResponse(body: unknown, status = 200) {
  return new HttpResponse(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function success<T>(data: T) {
  return jsonResponse({ success: true, data });
}

export function failure(message: string, status = 400) {
  return jsonResponse({ success: false, message }, status);
}

export function networkError() {
  return HttpResponse.error();
}

export const delayedHandlers = () => {
  return http.get('/api/v1/slow', async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return success({ ok: true });
  });
};
