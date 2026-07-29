import type { MockScenario } from './types';

export const mockConfig = {
  // Development defaults to fixtures. Set VITE_USE_MOCK_DATA=false to exercise the real API.
  enabled: import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_DATA !== 'false',
  latencyMs: Number(import.meta.env.VITE_MOCK_LATENCY_MS ?? 350),
  scenario: (import.meta.env.VITE_MOCK_SCENARIO ?? 'success') as MockScenario,
} as const;

export const isMockingEnabled = () => mockConfig.enabled;
