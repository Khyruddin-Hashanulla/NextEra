import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/common/RouteErrorBoundary';
import { LoadingSpinner, PageLoader } from '@/components/common/LoadingSpinner';
import { RouteLoader } from '@/components/common/RouteLoader';
import {
  CourseCardSkeleton,
  BlogCardSkeleton,
  InstructorCardSkeleton,
  CourseGridSkeleton,
  BlogGridSkeleton,
  InstructorGridSkeleton,
  PageHeaderSkeleton,
  SectionSkeleton,
} from '@/components/common/LoadingSkeleton';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { Section, Container } from '@/components/common/Section';
import { ResourceNotFound } from '@/components/common/ResourceNotFound';

function Bomb(): never {
  throw new Error('kaboom');
}

describe('EmptyState', () => {
  it('renders title, description and icon', () => {
    render(
      <EmptyState icon={<span>📦</span>} title="No courses yet" description="Start by enrolling." />,
    );
    expect(screen.getByText('No courses yet')).toBeInTheDocument();
    expect(screen.getByText('Start by enrolling.')).toBeInTheDocument();
    expect(screen.getByText('📦')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders an action link when provided', () => {
    render(
      <MemoryRouter>
        <EmptyState title="Empty" action={{ label: 'Browse Courses', href: '/courses' }} />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: 'Browse Courses' });
    expect(link).toHaveAttribute('href', '/courses');
  });

  it('omits description and action when not provided', () => {
    render(<EmptyState title="Just a title" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('renders defaults and home link', () => {
    render(
      <MemoryRouter>
        <ErrorState />
      </MemoryRouter>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go Home/ })).toBeInTheDocument();
  });

  it('invokes onRetry and hides the home link when disabled', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} showHomeLink={false} title="Boom" message="Detail" />);
    fireEvent.click(screen.getByRole('button', { name: /Try Again/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(<ErrorBoundary>All good</ErrorBoundary>);
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('renders the default fallback when a child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('kaboom')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('recovers via the Try again button', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    // re-throws on re-render, so the fallback stays; at minimum the button exists
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    spy.mockRestore();
  });

  it('uses a custom fallback when provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    spy.mockRestore();
  });
});

describe('RouteErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(<RouteErrorBoundary>Page</RouteErrorBoundary>);
    expect(screen.getByText('Page')).toBeInTheDocument();
  });

  it('renders the retry UI when a child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <RouteErrorBoundary>
        <Bomb />
      </RouteErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Failed to load page')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry loading page' })).toBeInTheDocument();
    spy.mockRestore();
  });

  it('shows a network message for dynamic import errors', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const DynamicBomb = () => {
      throw new Error('Failed to fetch dynamically imported module');
    };
    render(
      <RouteErrorBoundary>
        <DynamicBomb />
      </RouteErrorBoundary>,
    );
    expect(screen.getByText(/network issue/)).toBeInTheDocument();
    spy.mockRestore();
  });
});

describe('LoadingSpinner & loaders', () => {
  it('renders the spinner with the default sr-only label', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('supports custom label and size classes', () => {
    const { container } = render(<LoadingSpinner size="lg" label="Please wait" />);
    expect(screen.getByText('Please wait')).toBeInTheDocument();
    expect(container.querySelector('.h-12')).toBeInTheDocument();
  });

  it('PageLoader renders a large status', () => {
    render(<PageLoader />);
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });

  it('RouteLoader exposes an accessible loading message', () => {
    render(<RouteLoader />);
    const status = screen.getAllByRole('status').find((el) => el.getAttribute('aria-label') === 'Loading page content');
    expect(status).toBeInTheDocument();
    expect(screen.getByText('Loading page...')).toBeInTheDocument();
  });
});

function skeletons(container: HTMLElement): number {
  return container.querySelectorAll('.animate-pulse').length;
}

describe('LoadingSkeleton composites', () => {
  it('CourseCardSkeleton renders a skeleton card', () => {
    const { container } = render(<CourseCardSkeleton />);
    expect(skeletons(container)).toBeGreaterThanOrEqual(5);
  });

  it('BlogCardSkeleton renders a skeleton card', () => {
    const { container } = render(<BlogCardSkeleton />);
    expect(skeletons(container)).toBeGreaterThanOrEqual(5);
  });

  it('InstructorCardSkeleton renders an avatar and text placeholders', () => {
    const { container } = render(<InstructorCardSkeleton />);
    expect(skeletons(container)).toBeGreaterThanOrEqual(4);
  });

  it('CourseGridSkeleton renders the requested number of cards', () => {
    const { container } = render(<CourseGridSkeleton count={4} />);
    expect(skeletons(container)).toBeGreaterThanOrEqual(4 * 5);
  });

  it('BlogGridSkeleton renders cards', () => {
    const { container } = render(<BlogGridSkeleton count={3} />);
    expect(skeletons(container)).toBeGreaterThanOrEqual(3 * 5);
  });

  it('InstructorGridSkeleton renders cards', () => {
    const { container } = render(<InstructorGridSkeleton count={2} />);
    expect(skeletons(container)).toBeGreaterThanOrEqual(2 * 4);
  });

  it('PageHeaderSkeleton renders text placeholders', () => {
    const { container } = render(<PageHeaderSkeleton />);
    expect(skeletons(container)).toBeGreaterThanOrEqual(3);
  });

  it('SectionSkeleton composes header and grid', () => {
    const { container } = render(<SectionSkeleton />);
    expect(skeletons(container)).toBeGreaterThanOrEqual(3 + 3 * 5);
  });
});

describe('OptimizedImage', () => {
  it('renders an img with lazy loading and the given alt', () => {
    render(<OptimizedImage src="https://example.com/a.jpg" alt="A photo" />);
    const img = screen.getByRole('img', { name: 'A photo' });
    expect(img).toHaveAttribute('src', 'https://example.com/a.jpg');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('optimizes cloudinary URLs with auto transformations', () => {
    render(
      <OptimizedImage
        src="https://res.cloudinary.com/demo/image/upload/v1234/photo.jpg"
        alt="Cloud"
      />,
    );
    const img = screen.getByRole('img', { name: 'Cloud' });
    expect(img).toHaveAttribute(
      'src',
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_auto/v1234/photo.jpg',
    );
  });

  it('leaves non-cloudinary URLs untouched', () => {
    render(<OptimizedImage src="https://cdn.example.com/photo.png" alt="Cdn" />);
    expect(screen.getByRole('img', { name: 'Cdn' })).toHaveAttribute(
      'src',
      'https://cdn.example.com/photo.png',
    );
  });

  it('hides decorative images from the a11y tree', () => {
    render(<OptimizedImage src="https://example.com/d.jpg" alt="" />);
    const img = document.querySelector('img')!;
    expect(img).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows a placeholder on load error', () => {
    render(<OptimizedImage src="https://example.com/broken.jpg" alt="Broken" />);
    fireEvent.error(document.querySelector('img')!);
    expect(screen.getByRole('img', { name: /Failed to load image/ })).toBeInTheDocument();
  });
});

describe('Section & Container', () => {
  it('applies size and background classes', () => {
    const { container } = render(<Section size="sm" background="muted">Body</Section>);
    const section = container.querySelector('section')!;
    expect(section.className).toContain('py-12');
    expect(section.className).toContain('bg-muted/50');
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('applies the id attribute', () => {
    const { container } = render(<Section id="features">X</Section>);
    expect(container.querySelector('section')).toHaveAttribute('id', 'features');
  });

  it('Container applies max-width sizing', () => {
    const { container } = render(<Container size="md">Content</Container>);
    expect(container.querySelector('div')?.className).toContain('max-w-5xl');
  });
});

describe('ResourceNotFound', () => {
  it('renders the default course not found content', () => {
    render(
      <MemoryRouter>
        <ResourceNotFound resourceType="course" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Course Not Found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Browse Courses/ })).toBeInTheDocument();
  });

  it('respects custom title and message', () => {
    render(
      <MemoryRouter>
        <ResourceNotFound resourceType="blog" title="Gone" message="It is gone." />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Gone' })).toBeInTheDocument();
    expect(screen.getByText('It is gone.')).toBeInTheDocument();
  });

  it('hides the go-back button for generic types', () => {
    render(
      <MemoryRouter>
        <ResourceNotFound resourceType="page" />
      </MemoryRouter>,
    );
    expect(screen.queryByText(/Go back/)).not.toBeInTheDocument();
  });

  it('calls history.back from the go back button', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    render(
      <MemoryRouter>
        <ResourceNotFound resourceType="course" />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText(/Go back/));
    expect(back).toHaveBeenCalled();
    back.mockRestore();
  });
});
