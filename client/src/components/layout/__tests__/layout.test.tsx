import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { renderWithProviders } from '@/test/render/renderWithProviders';
import { createAuthValue, MockAuthProvider } from '@/test/mocks/providers';
import type { User } from '@/types/user';
import { useLocation } from 'react-router-dom';

const studentUser: User = {
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
  return <span data-testid="location">{location.pathname + location.search}</span>;
}

function renderGuard(ui: React.ReactNode, initialEntries: string[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="*" element={ui} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AuthGuard', () => {
  it('renders the loader while loading', () => {
    renderGuard(
      <MockAuthProvider value={createAuthValue({ isLoading: true })}>
        <AuthGuard>Protected</AuthGuard>
      </MockAuthProvider>,
      ['/protected'],
    );
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    expect(screen.queryByText('Protected')).not.toBeInTheDocument();
  });

  it('redirects to login when unauthenticated', () => {
    renderGuard(
      <MockAuthProvider value={createAuthValue({ isAuthenticated: false })}>
        <Routes>
          <Route
            path="/protected"
            element={
              <>
                <AuthGuard>Protected</AuthGuard>
                <LocationProbe />
              </>
            }
          />
          <Route path="/auth/login" element={<LocationProbe />} />
        </Routes>
      </MockAuthProvider>,
      ['/protected'],
    );
    expect(screen.getByTestId('location')).toHaveTextContent('/auth/login');
    expect(screen.queryByText('Protected')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    renderGuard(
      <MockAuthProvider value={createAuthValue({ isAuthenticated: true, user: studentUser })}>
        <AuthGuard>Protected content</AuthGuard>
      </MockAuthProvider>,
      ['/protected'],
    );
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('redirects to the dashboard when the role is not allowed', () => {
    renderGuard(
      <MockAuthProvider value={createAuthValue({ isAuthenticated: true, user: studentUser })}>
        <Routes>
          <Route
            path="/protected"
            element={
              <>
                <AuthGuard allowedRoles={['instructor']}>Instructor only</AuthGuard>
                <LocationProbe />
              </>
            }
          />
          <Route path="/student" element={<LocationProbe />} />
        </Routes>
      </MockAuthProvider>,
      ['/protected'],
    );
    expect(screen.getByTestId('location')).toHaveTextContent('/student');
    expect(screen.queryByText('Instructor only')).not.toBeInTheDocument();
  });

  it('renders children when the role is allowed', () => {
    renderGuard(
      <MockAuthProvider value={createAuthValue({ isAuthenticated: true, user: studentUser })}>
        <AuthGuard allowedRoles={['student']}>Student only</AuthGuard>
      </MockAuthProvider>,
      ['/protected'],
    );
    expect(screen.getByText('Student only')).toBeInTheDocument();
  });
});

describe('Footer', () => {
  it('renders branding, link columns and copyright', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /NextEra/ })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Product links' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Company links' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Support links' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Legal links' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Privacy Policy' }).length).toBeGreaterThan(0);
    expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
  });

  it('renders the current year in the copyright', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
  });

  it('renders social links with aria labels', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    for (const label of ['Facebook', 'Twitter', 'LinkedIn', 'YouTube']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });
});

describe('Navbar', () => {
  it('renders the logo, primary links and auth buttons when logged out', () => {
    renderWithProviders(<Navbar />, { route: '/', mockAuth: createAuthValue() });
    expect(screen.getByRole('link', { name: /NextEra/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Courses' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Free Account' })).toBeInTheDocument();
  });

  it('shows the user name and sign out when authenticated', () => {
    renderWithProviders(<Navbar />, {
      route: '/',
      mockAuth: createAuthValue({ user: studentUser, isAuthenticated: true }),
    });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('opens the Explore dropdown', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Navbar />, { route: '/', mockAuth: createAuthValue() });
    await user.click(screen.getByRole('button', { name: /Explore/ }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /All Courses/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Instructors/ })).toBeInTheDocument();
  });

  it('closes the Explore dropdown when Escape is pressed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Navbar />, { route: '/', mockAuth: createAuthValue() });
    await user.click(screen.getByRole('button', { name: /Explore/ }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens the search input and navigates on submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <Navbar />
        <LocationProbe />
      </>,
      { route: '/', mockAuth: createAuthValue() },
    );
    await user.click(screen.getByRole('button', { name: 'Open search' }));
    const input = screen.getByPlaceholderText('Search courses...');
    await user.type(input, 'react');
    fireEvent.submit(input.closest('form')!);
    expect(screen.getByTestId('location')).toHaveTextContent('/courses');
    expect(screen.getByTestId('location').textContent).toContain('search=react');
  });

  it('toggles the theme through the theme button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Navbar />, {
      route: '/',
      mockAuth: createAuthValue(),
    });
    const button = screen.getByRole('button', { name: 'Switch to light theme' });
    await user.click(button);
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument();
  });

  it('opens the mobile menu and navigates when a link is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <Navbar />
        <LocationProbe />
      </>,
      { route: '/', mockAuth: createAuthValue() },
    );
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const dialog = screen.getByRole('dialog', { name: 'Navigation menu' });
    expect(dialog).toBeInTheDocument();
    await user.click(within(dialog).getByRole('link', { name: 'Contact' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/contact');
  });

  it('signs out and shows a toast', async () => {
    const user = userEvent.setup();
    const logout = vi.fn(async () => {});
    renderWithProviders(
      <>
        <Navbar />
        <LocationProbe />
      </>,
      {
        route: '/',
        mockAuth: createAuthValue({ user: studentUser, isAuthenticated: true, logout }),
      },
    );
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(logout).toHaveBeenCalled();
    expect(await screen.findByText('Logged out successfully')).toBeInTheDocument();
  });
});
