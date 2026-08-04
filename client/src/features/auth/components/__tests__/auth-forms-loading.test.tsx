import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { renderWithProviders } from '@/test/render/renderWithProviders';
import { createAuthValue } from '@/test/mocks/providers';
import { LoginForm } from '@/features/auth/components/LoginForm';

vi.mock('@/features/auth/hooks/useAuthMutations', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/auth/hooks/useAuthMutations')>();
  return {
    ...actual,
    useLoginMutation: () => ({
      mutateAsync: vi.fn(),
      isPending: true,
      isError: false,
      error: null,
      reset: vi.fn(),
    }),
  };
});

describe('LoginForm loading state', () => {
  it('disables the submit button and marks it busy while the login mutation is pending', () => {
    renderWithProviders(
      <GoogleOAuthProvider clientId="test-client-id">
        <LoginForm />
      </GoogleOAuthProvider>,
      { route: '/auth/login', mockAuth: createAuthValue() },
    );

    const button = screen.getByRole('button', { name: 'Sign in' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
  });
});
