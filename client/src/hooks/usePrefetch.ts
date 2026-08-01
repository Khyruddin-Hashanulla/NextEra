import { useCallback } from 'react';

export function usePrefetch(factory: () => Promise<any>) {
  return useCallback(() => {
    factory();
  }, [factory]);
}
