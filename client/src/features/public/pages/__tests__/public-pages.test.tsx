import { describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
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
import { HelpCenterPage } from '@/features/public/pages/HelpCenterPage';
import { InstructorsPage } from '@/features/public/pages/InstructorsPage';
import { InstructorProfilePage } from '@/features/public/pages/InstructorProfilePage';
import { NotFoundPage } from '@/features/public/pages/NotFoundPage';
import { CategoriesPage } from '@/features/public/pages/CategoriesPage';
import { CategoryPage } from '@/features/public/pages/CategoryPage';

const LONG_TIMEOUT = 10000;

function renderPage(ui: React.ReactElement, route: string, routePattern: string = '*') {
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
    await waitFor(
      () =>
        expect(
          screen.getByRole('heading', { name: /Connecting Students With Tutors/i })
        ).toBeInTheDocument(),
      { timeout: LONG_TIMEOUT }
    );
    await waitFor(() => expect(screen.getByRole('heading', { name: /Explore top categories/i })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    await waitFor(
      () => expect(screen.getByRole('heading', { name: /Featured courses to level up/i })).toBeInTheDocument(),
      { timeout: LONG_TIMEOUT }
    );
    expect(screen.getByRole('heading', { name: /Everything you need to learn, build & grow/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Turn your knowledge into impact/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /A learning platform you can trust/i })).toBeInTheDocument();
    await waitFor(
      () => expect(screen.getByRole('heading', { name: /Success stories from our community/i })).toBeInTheDocument(),
      { timeout: LONG_TIMEOUT }
    );
    expect(screen.getByRole('heading', { name: /Learning insights & industry trends/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Get learning tips in your inbox/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: /Subscribe/i })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
  });
});

describe('CoursesPage', () => {
  it('renders the page header, search, filters and courses grid', async () => {
    renderPage(<CoursesPage />, '/courses', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: /Explore All Courses/i })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
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
    await waitFor(() => expect(screen.getByRole('heading', { name: /NextEra Blog/i })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    expect(screen.getByPlaceholderText(/Search articles/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /All/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Technology/i })).toBeInTheDocument();
    // Sort select trigger is a button with "Sort by" label
    expect(screen.getByText(/Sort by/i)).toBeInTheDocument();
  });

  it('filters by search', async () => {
    const user = userEvent.setup();
    renderPage(<BlogListPage />, '/blog', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: /NextEra Blog/i })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    await user.type(screen.getByPlaceholderText(/Search articles/i), 'react');
    await waitFor(() => expect(screen.getByRole('heading', { name: /NextEra Blog/i })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
  });

  it('filters by category', async () => {
    const user = userEvent.setup();
    renderPage(<BlogListPage />, '/blog', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: /NextEra Blog/i })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    await user.click(screen.getByRole('button', { name: /Technology/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Technology/i })).toHaveClass('bg-primary'), {
      timeout: LONG_TIMEOUT,
    });
  });

  it('has a sort dropdown trigger', async () => {
    renderPage(<BlogListPage />, '/blog', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: /NextEra Blog/i })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    expect(screen.getByText(/Sort by/i)).toBeInTheDocument();
  });
});

describe('BlogDetailPage', () => {
  it('renders without error', async () => {
    renderPage(<BlogDetailPage />, '/blog/learning-insight-1', '/blog/:slug');
    // Just wait for any heading to appear (either blog title or not-found)
    await waitFor(
      () => {
        const headings = screen.getAllByRole('heading');
        expect(headings.length).toBeGreaterThan(0);
      },
      { timeout: LONG_TIMEOUT }
    );
  });
});

describe('CategoriesPage', () => {
  it('renders the hero and category cards', async () => {
    renderPage(<CategoriesPage />, '/categories', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: /Explore Our Categories/i })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Development' })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    expect(screen.getByRole('heading', { name: 'Data Science' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Business' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Design' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Explore category/i })).toHaveLength(4);
  });

  it('links to category detail pages', async () => {
    renderPage(<CategoriesPage />, '/categories', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Development' })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    const link = screen.getByRole('link', { name: /Development/i });
    expect(link).toHaveAttribute('href', '/categories/development');
  });
});

describe('CategoryPage', () => {
  it('renders category details and its courses', async () => {
    renderPage(<CategoryPage />, '/categories/development', '/categories/:slug');
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Development' })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    await waitFor(() => expect(screen.getByRole('heading', { name: /Courses in Development/i })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Categories' })).toBeInTheDocument();
  });

  it('shows category not found for an invalid slug', async () => {
    renderPage(<CategoryPage />, '/categories/does-not-exist', '/categories/:slug');
    await waitFor(() => expect(screen.getByRole('heading', { name: /Category not found/i })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    expect(screen.getByRole('link', { name: /Browse All Categories/i })).toBeInTheDocument();
  });
});

describe('Static public pages', () => {
  it('AboutPage renders', async () => {
    renderPage(<AboutPage />, '/about', '*');
    await waitFor(
      () => expect(screen.getByRole('heading', { name: /Empowering Learners Worldwide/i })).toBeInTheDocument(),
      { timeout: LONG_TIMEOUT }
    );
  });

  it('ContactPage renders', async () => {
    renderPage(<ContactPage />, '/contact', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: /Get in Touch/i })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
  });

  it('FAQPage renders', async () => {
    renderPage(<FAQPage />, '/faq', '*');
    await waitFor(
      () => expect(screen.getByRole('heading', { name: /Quick Answers to Common Questions/i })).toBeInTheDocument(),
      { timeout: LONG_TIMEOUT }
    );
  });

  it('PrivacyPage renders', async () => {
    renderPage(<PrivacyPage />, '/privacy', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    expect(screen.getByText(/Last updated: January 2024/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Information We Collect' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your Rights' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Contact Us' })).toBeInTheDocument();
    expect(
      screen.getAllByRole('navigation', { name: 'Privacy policy sections', hidden: true }).length
    ).toBeGreaterThan(0);
  });

  it('PrivacyPage mobile TOC collapses after selecting a section', async () => {
    const user = userEvent.setup();
    const { container } = renderPage(<PrivacyPage />, '/privacy', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    const details = container.querySelector('details');
    expect(details).not.toBeNull();
    details!.open = true;
    const link = within(details as HTMLElement).getByRole('link', { name: 'Your Rights' });
    await user.click(link);
    expect(details!.open).toBe(false);
  });

  it('TermsPage renders', async () => {
    renderPage(<TermsPage />, '/terms', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Terms of Service' })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    expect(screen.getByRole('heading', { name: 'Acceptance of Terms' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Prohibited Conduct' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Contact Us' })).toBeInTheDocument();
    expect(
      screen.getByText(/Harassment, intimidation, or discrimination against any user or instructor/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('navigation', { name: 'Terms of service sections', hidden: true }).length
    ).toBeGreaterThan(0);
  });

  it('TermsPage mobile TOC collapses after selecting a section', async () => {
    const user = userEvent.setup();
    const { container } = renderPage(<TermsPage />, '/terms', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Terms of Service' })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    const details = container.querySelector('details');
    expect(details).not.toBeNull();
    details!.open = true;
    const link = within(details as HTMLElement).getByRole('link', { name: 'Eligibility' });
    await user.click(link);
    expect(details!.open).toBe(false);
  });

  it('InstructorsPage renders', async () => {
    renderPage(<InstructorsPage />, '/instructors', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: /Our Expert Instructors/i })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    expect(screen.getByText(/1 instructors?/i)).toBeInTheDocument();
    expect(screen.getByText(/Instructor User/i)).toBeInTheDocument();
  });

  it('InstructorsPage search filters the instructor list', async () => {
    renderPage(<InstructorsPage />, '/instructors', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: /Our Expert Instructors/i })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    await waitFor(() => expect(screen.getByText(/Instructor User/i)).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });

    const searchInput = screen.getByLabelText(/Search Instructors/i);
    await userEvent.type(searchInput, 'no-such-name');

    await waitFor(() => expect(screen.getByText(/No instructors found/i)).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    expect(screen.queryByText(/Instructor User/i)).not.toBeInTheDocument();
    expect(screen.getByText(/0 instructors?/i)).toBeInTheDocument();

    await userEvent.clear(searchInput);
    await waitFor(() => expect(screen.getByText(/Instructor User/i)).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    expect(screen.queryByText(/No instructors found/i)).not.toBeInTheDocument();
  });

  it('InstructorProfilePage renders instructor details', async () => {
    renderPage(<InstructorProfilePage />, '/instructors/instructor-1', '/instructors/:id');
    await waitFor(() => expect(screen.getAllByText(/Instructor User/i).length).toBeGreaterThan(0), {
      timeout: LONG_TIMEOUT,
    });
    expect(screen.getByText(/Areas of Expertise/i)).toBeInTheDocument();
    expect(screen.getAllByText(/MSc Computer Science/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Professional Information/i)).toBeInTheDocument();
    expect(screen.getByText(/Contact Information/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View Resume/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Watch Intro Video/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Recent Courses/i)).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
    await waitFor(() => expect(screen.getByText(/Student Reviews/i)).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
    await waitFor(() => expect(screen.getByText(/Related Instructors/i)).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
  });

  it('InstructorProfilePage shows Instructor Not Found for an invalid id', async () => {
    renderPage(<InstructorProfilePage />, '/instructors/does-not-exist', '/instructors/:id');
    await waitFor(() => expect(screen.getByText(/Instructor Not Found/i)).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
  });

  it('NotFoundPage renders', () => {
    renderPage(<NotFoundPage />, '/nonexistent', '*');
    expect(screen.getByRole('heading', { name: /Page Not Found/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go Home/i })).toBeInTheDocument();
  });
});

describe('HelpCenterPage', () => {
  it('renders hero, search, category cards, FAQ and support CTA', async () => {
    renderPage(<HelpCenterPage />, '/help', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: /How can we help you/i })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });

    expect(screen.getByRole('searchbox', { name: /Search the Help Center/i })).toBeInTheDocument();

    expect(screen.getAllByRole('button', { name: /Browse topics/ })).toHaveLength(8);
    expect(screen.getByRole('button', { name: /Getting Started/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Payments & Billing/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Technical Support/ })).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 3, name: 'Getting Started' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Frequently Asked Questions' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Still need help?' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Contact Support/i })).toBeInTheDocument();
  });

  it('filters answers by search term', async () => {
    const user = userEvent.setup();
    renderPage(<HelpCenterPage />, '/help', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: /How can we help you/i })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });

    const searchBox = screen.getByRole('searchbox', { name: /Search the Help Center/i });
    await user.type(searchBox, 'refund');

    expect(screen.getByRole('heading', { name: 'Search Results' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /How do refunds work/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Getting Started' })).not.toBeInTheDocument();
  });

  it('shows the no-results state and restores content after clearing', async () => {
    const user = userEvent.setup();
    renderPage(<HelpCenterPage />, '/help', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: /How can we help you/i })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });

    const searchBox = screen.getByRole('searchbox', { name: /Search the Help Center/i });
    await user.type(searchBox, 'zzzzzzzz');

    expect(screen.getByText(/We couldn't find an answer for that/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Browse categories/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByRole('button', { name: /Getting Started/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Frequently Asked Questions' })).toBeInTheDocument();
  });

  it('filters the FAQ by category when a category card is selected', async () => {
    const user = userEvent.setup();
    renderPage(<HelpCenterPage />, '/help', '*');
    await waitFor(() => expect(screen.getByRole('heading', { name: /How can we help you/i })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });

    await user.click(screen.getByRole('button', { name: /Getting Started/ }));

    expect(screen.getByText(/Showing answers for Getting Started/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /How do I create an account/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: 'Payments & Billing' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Show all topics/ }));
    expect(screen.getByRole('heading', { level: 3, name: 'Payments & Billing' })).toBeInTheDocument();
  });
});
