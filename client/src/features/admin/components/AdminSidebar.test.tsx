import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AdminSidebar } from '@/features/admin/components/AdminSidebar';
import { renderWithProviders } from '@/test/render/renderWithProviders';
import { createAuthValue } from '@/test/mocks/providers';
import type { User } from '@/types/user';

const adminUser: User = {
  _id: 'u3',
  name: 'Carol',
  email: 'carol@example.com',
  role: 'admin',
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

function renderAdminSidebar(logout: () => Promise<void> = vi.fn(async () => {})) {
  return renderWithProviders(
    <Routes>
      <Route path="/admin" element={<AdminSidebar />} />
      <Route path="/" element={<LocationProbe />} />
    </Routes>,
    {
      initialEntries: ['/admin'],
      mockAuth: createAuthValue({ user: adminUser, isAuthenticated: true, logout }),
    }
  );
}

describe('AdminSidebar', () => {
  it('renders a Logout item at the bottom of the sidebar', () => {
    renderAdminSidebar();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('anchors the sidebar flush to the top at full viewport height', () => {
    renderAdminSidebar();
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('top-0');
    expect(sidebar).toHaveClass('h-screen');
    expect(sidebar).not.toHaveClass('top-16');
  });

  it('signs out with toast and redirects to the home page', async () => {
    const user = userEvent.setup();
    const logout = vi.fn(async () => {});
    renderAdminSidebar(logout);

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Logged out successfully')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/');
  });
});
