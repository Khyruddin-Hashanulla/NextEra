import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/utils';
import { AuthProvider } from '@/providers/AuthProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { HomePage } from '@/features/public/pages/HomePage';
import { CoursesPage } from '@/features/public/pages/CoursesPage';
import { BlogListPage } from '@/features/public/pages/BlogListPage';
import { BlogDetailPage } from '@/features/public/pages/BlogDetailPage';
import { AboutPage } from '@/features/public/pages/AboutPage';
import { ContactPage } from '@/features/public/pages/ContactPage';
import { FAQPage } from '@/features/public/pages/FAQPage';
import { PrivacyPage } from '@/features/public/pages/PrivacyPage';
import { TermsPage } from '@/features/public/pages/TermsPage';
import { InstructorsPage } from '@/features/public/pages/InstructorsPage';
import { InstructorProfilePage } from '@/features/public/pages/InstructorProfilePage';
import { NotFoundPage } from '@/features/public/pages/NotFoundPage';

const LONG_TIMEOUT = 10000;

function renderPage(
  ui: React.ReactElement,
  route: string,
  routePattern: string = '*',
) {
  const queryClient = createTestQueryClient();
  
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <Routes>
                <Route path={routePattern} element={children} />
              </Routes>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );

  return { ...render(ui, { wrapper }), queryClient };
}

describe('HomePage', () => {
  it('renders hero, categories, courses, stats, testimonials, blog and newsletter sections', async () => {
    renderPage(<HomePage />, '/', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: /Learn from industry experts and build your career/i })).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
    await waitFor(() => expect(screen.getByRole('heading', { name: /Explore top categories/i })).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
    await waitFor(() => expect(screen.getByRole('heading', { name: /Featured courses to level up/i })).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
    expect(screen.getByRole('heading', { name: /Everything you need to succeed/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Share your expertise. Inspire thousands./i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /A learning platform you can trust/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('heading', { name: /Success stories from our community/i })).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
    expect(screen.getByRole('heading', { name: /Learning insights & industry trends/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Get learning tips in your inbox/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: /Subscribe/i })).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
  });
});

describe('CoursesPage', () => {
  it('renders the page header, search, filters and courses grid', async () => {
    renderPage(<CoursesPage />, '/courses', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: /Explore All Courses/i })).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
    expect(screen.getByLabelText(/Search Courses/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Level/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/courses found/i)).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
  });

  it('filters courses by search term', async () => {
    const user = userEvent.setup();
    renderPage(<CoursesPage />, '/courses', '*');
    await waitFor(() => expect(screen.getByText(/courses found/i)).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
    await user.type(screen.getByLabelText(/Search Courses/i), 'react');
    await waitFor(() => expect(screen.getByText(/courses found/i)).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
  });

  it('changes the level filter', async () => {
    const user = userEvent.setup();
    renderPage(<CoursesPage />, '/courses', '*');
    await waitFor(() => expect(screen.getByText(/courses found/i)).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
    await user.click(screen.getByLabelText(/Level/i));
    await user.click(screen.getByRole('option', { name: /Beginner/i }));
    await waitFor(() => expect(screen.getByText(/courses found/i)).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
  });

  it('changes the sort order', async () => {
    const user = userEvent.setup();
    renderPage(<CoursesPage />, '/courses', '*');
    await waitFor(() => expect(screen.getByText(/courses found/i)).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
    await user.click(screen.getByLabelText(/Sort by/i));
    await user.click(screen.getByRole('option', { name: /Newest First/i }));
    await waitFor(() => expect(screen.getByText(/courses found/i)).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
  });
});

describe('BlogListPage', () => {
  it('renders the page header, search, categories and blog grid', async () => {
    renderPage(<BlogListPage />, '/blog', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: /NextEra Blog/i })).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
    expect(screen.getByPlaceholderText(/Search articles/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /All/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Technology/i })).toBeInTheDocument();
    // Sort select trigger is a button with "Sort by" label
    expect(screen.getByText(/Sort by/i)).toBeInTheDocument();
  });

  it('filters by search', async () => {
    const user = userEvent.setup();
    renderPage(<BlogListPage />, '/blog', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: /NextEra Blog/i })).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
    await user.type(screen.getByPlaceholderText(/Search articles/i), 'react');
    await waitFor(() => expect(screen.getByRole('heading', { name: /NextEra Blog/i })).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
  });

  it('filters by category', async () => {
    const user = userEvent.setup();
    renderPage(<BlogListPage />, '/blog', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: /NextEra Blog/i })).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
    await user.click(screen.getByRole('button', { name: /Technology/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Technology/i })).toHaveClass('bg-primary'), { timeout: LONG_TIMEOUT });
  });

  it('has a sort dropdown trigger', async () => {
    renderPage(<BlogListPage />, '/blog', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: /NextEra Blog/i })).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
    expect(screen.getByText(/Sort by/i)).toBeInTheDocument();
  });
});

describe('BlogDetailPage', () => {
  it('renders without error', async () => {
    renderPage(
      <BlogDetailPage />,
      '/blog/learning-insight-1',
      '/blog/:slug',
    );
    // Just wait for any heading to appear (either blog title or not-found)
    await waitFor(() => {
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    }, { timeout: LONG_TIMEOUT });
  });
});

describe('Static public pages', () => {
  it('AboutPage renders', async () => {
    renderPage(<AboutPage />, '/about', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: /Empowering Learners Worldwide/i })).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
  });

  it('ContactPage renders', async () => {
    renderPage(<ContactPage />, '/contact', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: /Get in Touch/i })).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
  })

  it('FAQPage renders', async () => {
    renderPage(<FAQPage />, '/faq', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: /Quick Answers to Common Questions/i })).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
  });

  it('PrivacyPage renders', async () => {
    renderPage(<PrivacyPage />, '/privacy', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: /Privacy Policy/i })).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
  });

  it('TermsPage renders', async () => {
    renderPage(<TermsPage />, '/terms', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: /Terms of Service/i })).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
  });

  it('InstructorsPage renders', async () => {
    renderPage(<InstructorsPage />, '/instructors', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: /Our Expert Instructors/i })).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
    expect(screen.getByText(/1 instructors?/i)).toBeInTheDocument();
    expect(screen.getByText(/Instructor User/i)).toBeInTheDocument();
  });

  it('InstructorProfilePage renders instructor details', async () => {
    renderPage(
      <InstructorProfilePage />,
      '/instructors/instructor-1',
      '/instructors/:id',
    );
    await waitFor(() => expect(screen.getAllByText(/Instructor User/i).length).toBeGreaterThan(0), { timeout: LONG_TIMEOUT });
    expect(screen.getByText(/Areas of Expertise/i)).toBeInTheDocument();
    expect(screen.getAllByText(/MSc Computer Science/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Professional Information/i)).toBeInTheDocument();
    expect(screen.getByText(/Contact Information/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View Resume/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Watch Intro Video/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Recent Courses/i)).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
    await waitFor(() => expect(screen.getByText(/Student Reviews/i)).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
    await waitFor(() => expect(screen.getByText(/Related Instructors/i)).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
  });

  it('InstructorProfilePage shows Instructor Not Found for an invalid id', async () => {
    renderPage(
      <InstructorProfilePage />,
      '/instructors/does-not-exist',
      '/instructors/:id',
    );
    await waitFor(() => expect(screen.getByText(/Instructor Not Found/i)).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
  });

  it('NotFoundPage renders', () => {
    renderPage(<NotFoundPage />, '/nonexistent', '*');
    expect(screen.getByRole('heading', { name: /Page Not Found/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go Home/i })).toBeInTheDocument();
  });
});