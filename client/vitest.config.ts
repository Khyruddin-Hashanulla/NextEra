import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'coverage', 'build'],
    setupFiles: ['./src/test/setup.ts'],
    env: {
      VITE_USE_MOCK_DATA: 'false',
      VITE_API_BASE_URL: '/api/v1',
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true,
      },
    },
    testTimeout: 10000,
    hookTimeout: 15000,
    restoreMocks: true,
    clearMocks: true,
    coverage: {
      provider: 'v8',
      all: true,
      reporter: ['html', 'lcov', 'text', 'json'],
      reportsDirectory: './coverage',
      include: [
        'src/components/ui/**/*.{ts,tsx}',
        'src/components/common/**/*.{ts,tsx}',
        'src/components/layout/**/*.{ts,tsx}',
        'src/providers/**/*.{ts,tsx}',
        'src/hooks/**/*.{ts,tsx}',
        'src/api/**/*.{ts,tsx}',
        'src/lib/**/*.{ts,tsx}',
        'src/features/auth/**/*.{ts,tsx}',
        'src/features/public/components/**/*.{ts,tsx}',
        'src/features/**/hooks/**/*.{ts,tsx}',
      ],
      exclude: [
        'src/main.tsx',
        'src/App.tsx',
        'src/routes/**',
        'src/**/pages/**',
        'src/components/seo/**',
        'src/components/skeletons/**',
        'src/features/**/layout/**',
        'src/test/**',
        'src/mocks/**',
        'src/**/*.d.ts',
        'src/**/types/**',
        'src/**/index.ts',
      ],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
});
