import { render, type RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { type ReactElement } from 'react';

export interface RenderWithRouterOptions {
  route?: string;
  initialEntries?: string[];
}

export function renderWithRouter(ui: ReactElement, options: RenderWithRouterOptions = {}): RenderResult {
  const { route = '/', initialEntries } = options;
  return render(<MemoryRouter initialEntries={initialEntries ?? [route]}>{ui}</MemoryRouter>);
}
