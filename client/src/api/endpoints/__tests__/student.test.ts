import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { studentApi } from '@/api/endpoints/student';
import axiosInstance from '@/api/axiosInstance';

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

describe('studentApi endpoint sweep', () => {
  it.each(Object.entries(studentApi))('%s dispatches a request and resolves', async (_name, fn) => {
    const before = recorded.length;
    const result = await (fn as (...args: unknown[]) => Promise<unknown>)();
    expect(result).toBeDefined();
    expect(recorded.length).toBeGreaterThan(before);
  });
});

describe('studentApi uploadAssignmentFile', () => {
  it('uploads a file with a progress callback', async () => {
    const file = new File(['content'], 'notes.txt', { type: 'text/plain' });
    const onProgress = vi.fn();
    const postSpy = vi
      .spyOn(axiosInstance, 'post')
      .mockResolvedValue({ data: { data: { url: 'u', publicId: 'p', name: 'n' } } } as never);

    const promise = studentApi.uploadAssignmentFile(file, onProgress);
    const config = postSpy.mock.calls[0]?.[2] as { onUploadProgress?: (e: { total: number; loaded: number }) => void };
    config?.onUploadProgress?.({ total: 100, loaded: 40 });
    await promise;

    expect(postSpy).toHaveBeenCalledWith(
      '/upload/assignment',
      expect.any(FormData),
      expect.objectContaining({ signal: undefined, onUploadProgress: expect.any(Function) })
    );
    expect(onProgress).toHaveBeenCalledWith(40);
  });

  it('skips progress when the total is unknown', async () => {
    const file = new File(['content'], 'notes.txt');
    const onProgress = vi.fn();
    const postSpy = vi.spyOn(axiosInstance, 'post').mockResolvedValue({ data: { data: {} } } as never);

    const promise = studentApi.uploadAssignmentFile(file, onProgress);
    const config = postSpy.mock.calls[0]?.[2] as { onUploadProgress?: (e: { loaded: number }) => void };
    config?.onUploadProgress?.({ loaded: 10 });
    await promise;

    expect(onProgress).not.toHaveBeenCalled();
  });
});
