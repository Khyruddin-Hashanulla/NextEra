import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route, useLocation } from 'react-router-dom';
import { UserMenu } from '@/components/layout/UserMenu';
import { renderWithProviders } from '@/test/render/renderWithProviders';
import { createAuthValue } from '@/test/mocks/providers';
import type { User } from '@/types/user';

function makeUser(role: User['role']): User {
  return {
    _id: 'u1',
    name: 'Alice',
    email: 'alice@example.com',
    role,
    avatar: { url: '', publicId: '' },
    bio: '',
    socialLinks: { youtube: '', twitter: '', linkedin: '', github: '', portfolio: '', website: '' },
    isEmailVerified: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  };
}

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

function renderMenu(user: User, logout?: () => Promise<void>) {
  return renderWithProviders(
    <Routes>
      <Route
        path="/"
        element={
          <>
            <UserMenu />
            <LocationProbe />
          </>
        }
      />
      <Route path="/student" element={<LocationProbe />} />
      <Route path="/student/profile" element={<LocationProbe />} />
      <Route path="/student/my-courses" element={<LocationProbe />} />
      <Route path="/instructor" element={<LocationProbe />} />
      <Route path="/instructor/profile" element={<LocationProbe />} />
      <Route path="/instructor/courses" element={<LocationProbe />} />
      <Route path="/admin" element={<LocationProbe />} />
      <Route path="/admin/settings" element={<LocationProbe />} />
      <Route path="/admin/courses" element={<LocationProbe />} />
      <Route path="/auth/login" element={<LocationProbe />} />
    </Routes>,
    {
      route: '/',
      mockAuth: createAuthValue({ user, isAuthenticated: true, ...(logout ? { logout } : {}) }),
    }
  );
}

describe('UserMenu', () => {
  it('renders nothing when there is no user', () => {
    renderWithProviders(<UserMenu />, { route: '/', mockAuth: createAuthValue() });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('opens the menu and exposes the expected actions', async () => {
    const user = userEvent.setup();
    renderMenu(makeUser('student'));

    await user.click(screen.getByRole('button', { name: 'Account menu for Alice' }));

    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Profile/ })).toHaveAttribute('href', '/student/profile');
    expect(screen.getByRole('menuitem', { name: /Dashboard/ })).toHaveAttribute('href', '/student');
    expect(screen.getByRole('menuitem', { name: /My Courses/ })).toHaveAttribute('href', '/student/my-courses');
    expect(screen.getByRole('menuitem', { name: /Settings/ })).toHaveAttribute('href', '/student/profile');
    expect(screen.getByRole('menuitem', { name: /Logout/ })).toBeInTheDocument();
  });

  it('maps links to the instructor routes', async () => {
    const user = userEvent.setup();
    renderMenu(makeUser('instructor'));

    await user.click(screen.getByRole('button', { name: 'Account menu for Alice' }));

    expect(screen.getByRole('menuitem', { name: /Profile/ })).toHaveAttribute('href', '/instructor/profile');
    expect(screen.getByRole('menuitem', { name: /Dashboard/ })).toHaveAttribute('href', '/instructor');
    expect(screen.getByRole('menuitem', { name: /My Courses/ })).toHaveAttribute('href', '/instructor/courses');
  });

  it('maps links to the admin routes without a broken profile page', async () => {
    const user = userEvent.setup();
    renderMenu(makeUser('admin'));

    await user.click(screen.getByRole('button', { name: 'Account menu for Alice' }));

    expect(screen.getByRole('menuitem', { name: /Profile/ })).toHaveAttribute('href', '/admin/settings');
    expect(screen.getByRole('menuitem', { name: /Dashboard/ })).toHaveAttribute('href', '/admin');
    expect(screen.getByRole('menuitem', { name: /My Courses/ })).toHaveAttribute('href', '/admin/courses');
    expect(screen.getByRole('menuitem', { name: /Settings/ })).toHaveAttribute('href', '/admin/settings');
  });

  it('navigates to the profile page when Profile is clicked', async () => {
    const user = userEvent.setup();
    renderMenu(makeUser('student'));

    await user.click(screen.getByRole('button', { name: 'Account menu for Alice' }));
    await user.click(screen.getByRole('menuitem', { name: /Profile/ }));

    expect(screen.getByTestId('location')).toHaveTextContent('/student/profile');
  });

  it('calls logout and redirects to the login page', async () => {
    const user = userEvent.setup();
    const logout = vi.fn(async () => {});
    renderMenu(makeUser('student'), logout);

    await user.click(screen.getByRole('button', { name: 'Account menu for Alice' }));
    await user.click(screen.getByRole('menuitem', { name: /Logout/ }));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('location')).toHaveTextContent('/auth/login');
  });
});
