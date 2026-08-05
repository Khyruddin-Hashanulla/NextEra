import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navbar } from '@/components/layout/Navbar';
import { renderWithProviders } from '@/test/render/renderWithProviders';
import { createTestQueryClient } from '@/test/utils';
import { QUERY_KEYS, TOKEN_KEYS } from '@/lib/constants';
import { buildUserWithRole } from '@/test/factories';

describe('Navbar logout state', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('flips from the account menu to login/register immediately after logout', async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    const me = buildUserWithRole('student', {
      _id: 'student-1',
      name: 'Student User',
      email: 'student@example.com',
    });

    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'test-access-token');
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, 'test-refresh-token');
    queryClient.setQueryData(QUERY_KEYS.auth.user, me);

    renderWithProviders(<Navbar />, { queryClient });

    expect(
      screen.getByRole('button', { name: 'Account menu for Student User' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign In' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Account menu for Student User' }));
    await user.click(screen.getByRole('menuitem', { name: /Logout/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Free Account' })).toBeInTheDocument();
    });
    expect(
      screen.queryByRole('button', { name: 'Account menu for Student User' }),
    ).not.toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)).toBeNull();
    expect(queryClient.getQueryData(QUERY_KEYS.auth.user)).toBeUndefined();
  });
});
