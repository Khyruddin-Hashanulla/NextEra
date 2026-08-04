import { render, type RenderResult } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactElement } from 'react';
import { createTestQueryClient } from '@/test/utils';

export function renderWithQueryClient(ui: ReactElement, queryClient = createTestQueryClient()): RenderResult {
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}
