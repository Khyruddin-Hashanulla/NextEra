# Client Testing Guide

## Overview

This document describes the testing setup, conventions, and practices for the NextEra client application.

## Test Stack

- **Vitest** - Test runner (v2.1.9)
- **React Testing Library** - Component testing utilities
- **@testing-library/user-event** - User interaction simulation
- **MSW (Mock Service Worker)** - API mocking
- **jest-axe** - Accessibility testing
- **@vitest/coverage-v8** - Code coverage

## Test Commands

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Check coverage thresholds
npm run test:coverage:check

# CI mode (verbose + JSON output)
npm run test:ci
```

## Project Structure

```
src/
├── test/
│   ├── setup.ts              # Global test setup (MSW, polyfills, jest-axe)
│   ├── globals.d.ts          # TypeScript globals for vitest/jest-axe
│   ├── mocks/
│   │   ├── server.ts         # MSW server setup
│   │   ├── handlers.ts       # Aggregated MSW handlers
│   │   ├── handlers/*.ts     # Domain-specific handlers (auth, user, course, etc.)
│   │   ├── helpers.ts        # MSW response helpers
│   │   ├── data.ts           # Mock data fixtures
│   │   └── types.ts          # MSW type definitions
│   ├── render/
│   │   └── renderWithProviders.tsx  # Custom render with providers
│   ├── mocks/
│   │   └── providers.tsx     # Mock context providers
│   ├── utils/
│   │   ├── a11y.ts           # Accessibility test utilities
│   │   ├── breakpoints.ts    # Responsive test utilities
│   │   └── index.ts          # Barrel exports
│   ├── factories/            # Test data factories
│   └── fixtures/             # Static test fixtures
├── components/
│   ├── ui/__tests__/         # UI primitive tests
│   ├── common/__tests__/     # Common component tests
│   └── layout/__tests__/     # Layout component tests
├── features/
│   ├── auth/
│   │   ├── components/__tests__/  # Auth form tests
│   │   ├── hooks/__tests__/       # Auth hook tests
│   │   └── pages/__tests__/       # Auth page tests
│   └── public/
│       └── pages/__tests__/   # Public page tests
└── providers/__tests__/      # Provider tests
```

## Writing Tests

### Component Tests

Use `renderWithProviders` for components that need auth, theme, or toast context:

```tsx
import { renderWithProviders } from '@/test/render/renderWithProviders';
import { GoogleOAuthProvider } from '@react-oauth/google';

function renderPage(ui: React.ReactElement, route = '/') {
  return renderWithProviders(
    <GoogleOAuthProvider clientId="test-client-id">{ui}</GoogleOAuthProvider>,
    { route }
  );
}

it('renders correctly', () => {
  renderPage(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Using MSW for API Mocking

The MSW handlers are automatically registered. For test-specific overrides:

```tsx
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

it('handles custom response', async () => {
  server.use(
    http.get('/api/v1/custom', () => HttpResponse.json({ data: 'custom' }))
  );
  // ... test
});
```

### Testing User Interactions

Use `@testing-library/user-event`:

```tsx
import userEvent from '@testing-library/user-event';

it('clicks button', async () => {
  const user = userEvent.setup();
  render(<Button onClick={onClick}>Click</Button>);
  await user.click(screen.getByRole('button', { name: 'Click' }));
  expect(onClick).toHaveBeenCalled();
});
```

### Accessibility Tests

Use `runA11yChecks` from `@/test/utils/a11y`:

```tsx
import { runA11yChecks } from '@/test/utils/a11y';

it('has no a11y violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await runA11yChecks(container);
  expect(results.violations).toHaveLength(0);
});
```

### Responsive Tests

Use utilities from `@/test/utils/breakpoints`:

```tsx
import { setViewport, spyOnMatchMedia, BREAKPOINTS } from '@/test/utils/breakpoints';

it('renders at mobile', () => {
  setViewport(BREAKPOINTS.mobile);
  render(<MyComponent />);
  // assertions
});

it('responds to media queries', () => {
  const { emit } = spyOnMatchMedia();
  render(<MyComponent />);
  emit('(max-width: 768px)', true);
  // assertions
});
```

## Test Conventions

1. **File naming**: `*.test.tsx` for component tests, `*.test.ts` for utility tests
2. **Test organization**: Group by component/page using `describe` blocks
3. **Async handling**: Use `waitFor` or `findBy*` queries for async content
4. **Cleanup**: `afterEach` in setup clears MSW handlers, localStorage, and RTL cleanup
5. **Mocks**: Use `vi.fn()` for function mocks, `createAuthValue` for auth context

## Coverage Thresholds

Configured in `vitest.config.ts`:

- Statements: 90%
- Branches: 85%
- Functions: 90%
- Lines: 90%

Run `npm run test:coverage:check` to verify thresholds.

## Common Patterns

### Testing Protected Routes

```tsx
import { renderWithProviders } from '@/test/render/renderWithProviders';
import { createAuthValue } from '@/test/mocks/providers';

it('redirects when unauthenticated', () => {
  renderWithProviders(<ProtectedComponent />, {
    route: '/protected',
    mockAuth: createAuthValue({ isAuthenticated: false })
  });
  expect(screen.getByText('Sign in')).toBeInTheDocument();
});
```

### Testing Forms

```tsx
it('submits form', async () => {
  const user = userEvent.setup();
  render(<MyForm />);
  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.click(screen.getByRole('button', { name: 'Submit' }));
  await waitFor(() => expect(screen.getByText('Success')).toBeInTheDocument());
});
```

### Testing with React Router

Use `MemoryRouter` for navigation tests:

```tsx
import { MemoryRouter, Routes, Route } from 'react-router-dom';

function renderWithRouter(ui: React.ReactElement, route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="*" element={ui} />
      </Routes>
    </MemoryRouter>
  );
}
```

## Debugging Tests

1. Use `screen.debug()` to print DOM
2. Use `console.log` in tests (output shown in verbose mode)
3. Run single test: `npx vitest run -t "test name"`
4. Run with UI: `npm run test:ui`

## CI Integration

The `test:ci` script produces:
- Verbose console output
- JSON test results at `coverage/test-results.json`
- Coverage reports in `coverage/`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Test hangs | Check for infinite loops, timers not cleaned up |
| MSW not intercepting | Ensure `server.listen()` in setup, check URL paths |
| `act()` warnings | Wrap state updates in `act(() => { ... })` |
| Port conflicts | MSW uses random ports, should not conflict |
| Coverage too low | Add tests for uncovered lines, check thresholds |

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/docs/)
- [jest-axe](https://github.com/nickcolley/jest-axe)