declare module 'jest-axe' {
  import { AxeResults, RunOptions } from 'axe-core';

  export function configureAxe(options?: object): {
    (container: HTMLElement | Document, options?: RunOptions): Promise<AxeResults>;
  };

  export function toHaveNoViolations(): {
    pass: boolean;
    message: () => string;
  };
}

declare module 'axe-core' {
  export interface RunOptions {
    runOnly?: {
      type: 'tag' | 'rule';
      values: string[];
    };
    rules?: Record<string, { enabled: boolean }>;
  }

  export interface AxeResults {
    violations: Array<{
      id: string;
      impact: string;
      tags: string[];
      description: string;
      help: string;
      helpUrl: string;
      nodes: Array<{
        html: string;
        target: string[];
        failureSummary: string;
        any: Array<{
          id: string;
          data: unknown;
          relatedNodes: Array<{ target: string[] }>;
          impact: string;
          message: string;
        }>;
        all: Array<{
          id: string;
          data: unknown;
          relatedNodes: Array<{ target: string[] }>;
          impact: string;
          message: string;
        }>;
        none: Array<{
          id: string;
          data: unknown;
          relatedNodes: Array<{ target: string[] }>;
          impact: string;
          message: string;
        }>;
      }>;
    }>;
    passes: unknown[];
    incomplete: unknown[];
    inapplicable: unknown[];
    timestamp: string;
  }
}
