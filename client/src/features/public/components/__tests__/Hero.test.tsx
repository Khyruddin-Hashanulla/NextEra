import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { Hero } from '@/features/public/components/Hero';
import { renderWithProviders } from '@/test/render/renderWithProviders';
import { createAuthValue } from '@/test/mocks/providers';
import type { User } from '@/types/user';

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

function renderHero(user?: User) {
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<Hero />} />
    </Routes>,
    {
      route: '/',
      mockAuth: user ? createAuthValue({ user, isAuthenticated: true }) : createAuthValue(),
    }
  );
}

describe('Hero CTA', () => {
  it('routes Explore Courses to the courses listing for everyone', () => {
    renderHero();
    expect(screen.getByRole('link', { name: /Explore Courses/ })).toHaveAttribute('href', '/courses');
  });

  it('routes Start Teaching to the instructor apply page when logged out', () => {
    renderHero();
    const teaching = screen.getByRole('link', { name: /Start Teaching/ });
    expect(teaching).toHaveAttribute('href', '/instructor/apply');
    expect(screen.queryByRole('link', { name: /Go to Dashboard/ })).not.toBeInTheDocument();
  });

  it('routes the secondary CTA to the dashboard instead of the apply page when logged in', () => {
    renderHero(studentUser);
    const dashboard = screen.getByRole('link', { name: /Go to Dashboard/ });
    expect(dashboard).toHaveAttribute('href', '/student');
    expect(screen.queryByRole('link', { name: /Start Teaching/ })).not.toBeInTheDocument();
  });

  it('still routes Explore Courses to the courses listing when logged in', () => {
    renderHero(studentUser);
    expect(screen.getByRole('link', { name: /Explore Courses/ })).toHaveAttribute('href', '/courses');
  });
});
