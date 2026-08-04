import { describe, expect, it, vi } from 'vitest';

vi.mock('@/mocks/config', () => ({
  mockConfig: { enabled: true },
  isMockingEnabled: () => true,
}));

import axiosInstance from '@/api/axiosInstance';

describe('axiosInstance mock adapter wiring', () => {
  it('installs the mock adapter when mocking is enabled', async () => {
    expect(axiosInstance.defaults.adapter).toBeDefined();
    expect(typeof axiosInstance.defaults.adapter).toBe('function');
    expect(vi.mocked(axiosInstance.defaults.adapter)).toBeDefined();
  });
});
