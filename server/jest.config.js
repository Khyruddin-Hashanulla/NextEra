/** @type {import('jest').Config} */
const sharedConfig = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^sanitize-html$': '<rootDir>/src/__tests__/__mocks__/sanitize-html.ts',
  },
};

module.exports = {
  projects: [
    {
      ...sharedConfig,
      displayName: 'unit',
      testMatch: ['**/__tests__/**/*.test.ts'],
      testPathIgnorePatterns: ['/__tests__/integration/'],
    },
    {
      ...sharedConfig,
      displayName: 'integration',
      testMatch: ['**/__tests__/integration/**/*.test.ts'],
      setupFiles: ['<rootDir>/src/test/setup/env.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/test/setup/jest.setup.ts'],
      globalSetup: '<rootDir>/src/test/setup/global-setup.js',
      globalTeardown: '<rootDir>/src/test/setup/global-teardown.js',
      testTimeout: 30000,
      maxWorkers: 1,
    },
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/test/**',
    '!src/**/*.test.ts',
    '!src/**/*.interface.ts',
    '!src/**/index.ts',
    '!src/utils/logger.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'lcov', 'text-summary', 'json'],
};
