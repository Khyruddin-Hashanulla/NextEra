import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route, useLocation } from 'react-router-dom';
import { SidebarLogoutButton } from '@/components/layout/SidebarLogoutButton';
import { renderWithProviders } from '@/test/render/renderWithProviders';
import { createAuthValue } from '@/test/mocks/providers';
import type { User } from '@/types/user';

const testUser: User = {
  _id: 'u1',
  name: 'Alice',
  email: 'alice@example.com',
  role: 'student',
  avatar: { url: '', publicId: '' },
  bio: '',
  socialLinks: { youtube: '', twitter: '', linkedin: '', github: '', portfolio: '', website: '' },
  isEmailVerified: true,
  createdAt: '2024-01-01T00:00:00.000Z',
};

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

function renderButton(logout: () => Promise<void>) {
  return renderWithProviders(
    <Routes>
      <Route path="/dashboard" element={<><SidebarLogoutButton /><LocationProbe /></>} />
      <Route path="/" element={<LocationProbe />} />
    </Routes>,
    {
      initialEntries: ['/dashboard'],
      mockAuth: createAuthValue({ user: testUser, isAuthenticated: true, logout }),
    },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SidebarLogoutButton', () => {
  it('calls logout, shows a success toast and redirects to the home page', async () => {
    const user = userEvent.setup();
    const logout = vi.fn(async () => {});
    renderButton(logout);

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Logged out successfully')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/');
  });

  it('shows a loading state and disables the button while logging out', async () => {
    const user = userEvent.setup();
    let resolveLogout!: () => void;
    const logout = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveLogout = resolve;
        }),
    );
    renderButton(logout);

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    const pendingButton = screen.getByRole('button', { name: 'Logging out' });
    expect(pendingButton).toBeDisabled();
    expect(pendingButton).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Signing out...')).toBeInTheDocument();

    resolveLogout();
    await screen.findByText('Logged out successfully');
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('handles logout API errors gracefully without redirecting', async () => {
    const user = userEvent.setup();
    const logout = vi.fn(async () => {
      throw new Error('network down');
    });
    renderButton(logout);

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    expect(await screen.findByText('Sign out failed')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard');
    const button = screen.getByRole('button', { name: 'Logout' });
    expect(button).not.toBeDisabled();
  });
});
