import { describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route, useLocation } from 'react-router-dom';
import { InstructorLayout } from '@/features/instructor/InstructorLayout';
import { renderWithProviders } from '@/test/render/renderWithProviders';
import { createAuthValue } from '@/test/mocks/providers';
import type { User } from '@/types/user';

vi.mock('@/components/instructor/SubscriptionBadge', () => ({ default: () => null }));

const instructorUser: User = {
  _id: 'u2',
  name: 'Bob',
  email: 'bob@example.com',
  role: 'instructor',
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

function renderInstructorLayout(logout: () => Promise<void> = vi.fn(async () => {})) {
  return renderWithProviders(
    <Routes>
      <Route path="/instructor" element={<InstructorLayout />}>
        <Route index element={<LocationProbe />} />
      </Route>
      <Route path="/" element={<LocationProbe />} />
    </Routes>,
    {
      initialEntries: ['/instructor'],
      mockAuth: createAuthValue({ user: instructorUser, isAuthenticated: true, logout }),
    }
  );
}

describe('InstructorLayout', () => {
  it('renders a Logout item at the bottom of the desktop sidebar', () => {
    renderInstructorLayout();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('anchors the mobile navbar flush to the top with centered flex alignment', () => {
    renderInstructorLayout();

    const openButton = screen.getByRole('button', { name: 'Open menu' });
    const bar = openButton.closest('.sticky') as HTMLElement | null;
    expect(bar).not.toBeNull();
    expect(bar).toHaveClass('top-0');
    expect(bar).toHaveClass('h-16');
    expect(bar).toHaveClass('items-center');
    expect(bar).toHaveClass('gap-3');
    expect(within(bar as HTMLElement).getByText('Dashboard')).toHaveClass('leading-none');
  });

  it('sizes the desktop sidebar to the full viewport height', () => {
    renderInstructorLayout();

    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('lg:top-0');
    expect(sidebar).toHaveClass('lg:h-screen');
    expect(sidebar).not.toHaveClass('lg:top-16');
  });

  it('opens the mobile drawer from the hamburger and exposes accessible attributes', async () => {
    const user = userEvent.setup();
    renderInstructorLayout();

    const openButton = screen.getByRole('button', { name: 'Open menu' });
    expect(openButton).toHaveAttribute('aria-expanded', 'false');
    expect(openButton).toHaveAttribute('aria-controls');
    expect(openButton).toHaveAttribute('aria-haspopup', 'dialog');

    await user.click(openButton);

    expect(screen.getByRole('dialog', { name: 'Mobile navigation menu' })).toBeInTheDocument();
    expect(openButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows "Back to Website" and Logout inside the mobile drawer', async () => {
    const user = userEvent.setup();
    renderInstructorLayout();

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    const dialog = screen.getByRole('dialog', { name: 'Mobile navigation menu' });
    expect(within(dialog).getByRole('link', { name: /Back to Website/ })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('navigates to the public home page and closes the drawer from "Back to Website"', async () => {
    const user = userEvent.setup();
    renderInstructorLayout();

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(
      within(screen.getByRole('dialog', { name: 'Mobile navigation menu' })).getByRole('link', {
        name: /Back to Website/,
      })
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/');
  });

  it('signs out from the desktop sidebar with toast and redirect', async () => {
    const user = userEvent.setup();
    const logout = vi.fn(async () => {});
    renderInstructorLayout(logout);

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Logged out successfully')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/');
  });
});
