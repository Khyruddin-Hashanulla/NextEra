/// <reference types="vitest/globals" />
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';
import type { AxeMatchers } from 'jest-axe';
import 'vitest';

declare module 'vitest' {
  interface Assertion<T = any> extends TestingLibraryMatchers<any, T>, AxeMatchers {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<any, any> {}
}
