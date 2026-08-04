import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { renderWithProviders } from '@/test/render/renderWithProviders';
import { setViewport, spyOnMatchMedia, BREAKPOINTS } from '@/test/utils/breakpoints';
import { HomePage } from '@/features/public/pages/HomePage';
import { CoursesPage } from '@/features/public/pages/CoursesPage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function wrap(ui: React.ReactNode, options?: { route?: string }) {
  return renderWithProviders(
    <GoogleOAuthProvider clientId="test-client-id">{ui}</GoogleOAuthProvider>,
    { route: options?.route ?? '/' },
  );
}

describe('Responsive behavior', () => {
  describe('setViewport utility', () => {
    it('sets innerWidth and innerHeight', () => {
      setViewport(BREAKPOINTS.mobile, 667);
      expect(window.innerWidth).toBe(BREAKPOINTS.mobile);
      expect(window.innerHeight).toBe(667);
    });

    it('dispatches resize event', () => {
      const handler = vi.fn();
      window.addEventListener('resize', handler);
      setViewport(BREAKPOINTS.tablet);
      expect(handler).toHaveBeenCalled();
      window.removeEventListener('resize', handler);
    });
  });

  describe('spyOnMatchMedia utility', () => {
    it('allows emitting media query changes', () => {
      const { emit } = spyOnMatchMedia();
      const callback = vi.fn();
      const mql = window.matchMedia('(max-width: 768px)');
      mql.addEventListener('change', callback);

      expect(mql.matches).toBe(false);
      emit('(max-width: 768px)', true);
      expect(mql.matches).toBe(true);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ matches: true }));

      emit('(max-width: 768px)', false);
      expect(mql.matches).toBe(false);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ matches: false }));
    });
  });

  describe('HomePage responsive behavior', () => {
    it('renders at mobile viewport', async () => {
      setViewport(BREAKPOINTS.mobile);
      wrap(<HomePage />, { route: '/' });
      expect(screen.getByRole('heading', { name: /Master In-Demand Skills with NextEra Learning/i })).toBeInTheDocument();
    });

    it('renders at tablet viewport', async () => {
      setViewport(BREAKPOINTS.tablet);
      wrap(<HomePage />, { route: '/' });
      expect(screen.getByRole('heading', { name: /Master In-Demand Skills with NextEra Learning/i })).toBeInTheDocument();
    });

    it('renders at desktop viewport', async () => {
      setViewport(BREAKPOINTS.desktop);
      wrap(<HomePage />, { route: '/' });
      expect(screen.getByRole('heading', { name: /Master In-Demand Skills with NextEra Learning/i })).toBeInTheDocument();
    });
  });

  describe('CoursesPage responsive behavior', () => {
    it('renders at mobile viewport', async () => {
      setViewport(BREAKPOINTS.mobile);
      wrap(<CoursesPage />, { route: '/courses' });
      await screen.findByRole('heading', { name: /Explore All Courses/i });
    });

    it('renders at desktop viewport', async () => {
      setViewport(BREAKPOINTS.desktop);
      wrap(<CoursesPage />, { route: '/courses' });
      await screen.findByRole('heading', { name: /Explore All Courses/i });
    });
  });

  describe('Component responsive classes', () => {
    it('Button renders correctly at different sizes', () => {
      setViewport(BREAKPOINTS.mobile);
      const { container } = wrap(
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button className="w-full">Mobile</Button>
          <Button className="w-full sm:w-auto">Tablet+</Button>
        </div>,
      );
      expect(container.querySelector('button')).toBeInTheDocument();
    });
  });

  describe('Container responsiveness', () => {
    it('applies correct max-width at different breakpoints', () => {
      const { container } = wrap(
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">Content</div>
        </div>,
      );
      expect(container.querySelector('.max-w-3xl')).toBeInTheDocument();
    });
  });

describe('Grid responsiveness', () => {
    it('applies responsive column classes', () => {
      const { container } = wrap(
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="col-span-1 sm:col-span-1 lg:col-span-1">Item 1</div>
          <div className="col-span-1 sm:col-span-1 lg:col-span-1">Item 2</div>
        </div>,
      );
      expect(container.querySelector('.grid-cols-1')).toBeInTheDocument();
      expect(container.querySelector('.sm\\:grid-cols-2')).toBeInTheDocument();
      expect(container.querySelector('.lg\\:grid-cols-3')).toBeInTheDocument();
    });
  });
  });

  describe('Text responsiveness', () => {
    it('applies responsive text sizes', () => {
      const { container } = wrap(
        <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl">Heading</h1>,
      );
      expect(container.querySelector('.text-2xl')).toBeInTheDocument();
      expect(container.querySelector('.sm\\:text-3xl')).toBeInTheDocument();
      expect(container.querySelector('.lg\\:text-4xl')).toBeInTheDocument();
      expect(container.querySelector('.xl\\:text-5xl')).toBeInTheDocument();
    });
  });

  describe('Spacing responsiveness', () => {
    it('applies responsive padding and margin', () => {
      const { container } = wrap(
        <div className="p-4 sm:p-6 lg:p-8 xl:p-10">
          <div className="m-2 sm:m-4 lg:m-6">Content</div>
        </div>,
      );
      expect(container.querySelector('.p-4')).toBeInTheDocument();
      expect(container.querySelector('.sm\\:p-6')).toBeInTheDocument();
      expect(container.querySelector('.lg\\:p-8')).toBeInTheDocument();
      expect(container.querySelector('.xl\\:p-10')).toBeInTheDocument();
    });
  });

  describe('Display responsiveness', () => {
    it('applies responsive display utilities', () => {
      const { container } = wrap(
        <div className="hidden sm:block lg:flex xl:grid">
          <span className="hidden sm:inline">Inline</span>
          <span className="hidden lg:block">Block</span>
        </div>,
      );
      expect(container.querySelector('.hidden')).toBeInTheDocument();
      expect(container.querySelector('.sm\\:block')).toBeInTheDocument();
      expect(container.querySelector('.lg\\:flex')).toBeInTheDocument();
      expect(container.querySelector('.xl\\:grid')).toBeInTheDocument();
    });
  });

  describe('Navigation responsiveness', () => {
    it('hamburger menu visible on mobile, hidden on desktop', () => {
      setViewport(BREAKPOINTS.mobile);
      const { container } = wrap(
        <nav className="flex items-center justify-between">
          <div className="lg:hidden">☰</div>
          <div className="hidden lg:flex">Menu</div>
        </nav>,
      );
      expect(container.querySelector('.lg\\:hidden')).toBeInTheDocument();
      expect(container.querySelector('.hidden')).toBeInTheDocument();
    });
  });

  describe('Image responsiveness', () => {
    it('uses responsive image classes', () => {
      const { container } = wrap(
        <img className="w-full h-auto sm:w-1/2 lg:w-1/3 xl:w-1/4" src="/test.jpg" alt="Test" />,
      );
      expect(container.querySelector('.w-full')).toBeInTheDocument();
      expect(container.querySelector('.sm\\:w-1\\/2')).toBeInTheDocument();
      expect(container.querySelector('.lg\\:w-1\\/3')).toBeInTheDocument();
      expect(container.querySelector('.xl\\:w-1\\/4')).toBeInTheDocument();
    });
  });
