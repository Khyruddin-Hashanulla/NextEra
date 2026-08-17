import { describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http } from 'msw';
import { createTestQueryClient } from '@/test/utils';
import { AuthProvider } from '@/providers/AuthProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { server } from '@/test/mocks/server';
import { failure, success } from '@/test/mocks/helpers';
import { buildUserWithRole } from '@/test/factories';
import { TOKEN_KEYS } from '@/lib/constants';
import { CommunityForumsPage } from '@/features/community/pages/CommunityForumsPage';
import { CommunityTopicPage } from '@/features/community/pages/CommunityTopicPage';
import { communityTopic, communityTopicSolved, communityTopicLocked } from '@/test/fixtures';

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

describe('CommunityForumsPage (guest)', () => {
  it('renders hero, stats, categories and topic cards', async () => {
    renderPage(<CommunityForumsPage />, '/community', '*');

    await waitFor(() => expect(screen.getByRole('heading', { name: /Learn together. Ask anything./i })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });

    await waitFor(() => expect(screen.getByText(communityTopic.title)).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('320')).toBeInTheDocument();
    expect(screen.getAllByText(communityTopic.categoryName).length).toBeGreaterThan(0);
    expect(screen.getAllByText(communityTopic.content).length).toBeGreaterThan(0);
  });

  it('renders the search input and guest start-discussion link to login', async () => {
    renderPage(<CommunityForumsPage />, '/community', '*');
    await waitFor(() => expect(screen.getByLabelText(/Search discussions/i)).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    const startLink = screen.getByRole('link', { name: /Start a Discussion/i });
    expect(startLink).toHaveAttribute('href', '/auth/login');
  });

  it('filters topics by category from the sidebar', async () => {
    const user = userEvent.setup();
    renderPage(<CommunityForumsPage />, '/community', '*');

    await waitFor(() => expect(screen.getByText(communityTopic.title)).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
    await user.click(screen.getByRole('button', { name: 'Web Development' }));

    await waitFor(() => expect(screen.getByText(communityTopic.title)).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
    expect(screen.queryByText(communityTopicSolved.title)).not.toBeInTheDocument();
  });

  it('shows an empty state when search has no matches', async () => {
    const user = userEvent.setup();
    renderPage(<CommunityForumsPage />, '/community', '*');

    await waitFor(() => expect(screen.getByLabelText(/Search discussions/i)).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    await user.type(screen.getByLabelText(/Search discussions/i), 'zzzz-no-results');
    await waitFor(() => expect(screen.getByText(/No discussions found/i)).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
  });

  it('renders an error state when the feed fails to load', async () => {
    server.use(http.get('/api/v1/forum', () => failure('Server error', 500)));
    renderPage(<CommunityForumsPage />, '/community', '*');
    await waitFor(() => expect(screen.getByText(/Couldn't load discussions/i)).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
  });

  it('renders pagination when there are multiple pages', async () => {
    server.use(
      http.get('/api/v1/forum', () =>
        success({
          discussions: [communityTopic],
          pagination: { page: 1, pages: 3, total: 21, limit: 10 },
        })
      )
    );
    renderPage(<CommunityForumsPage />, '/community', '*');
    await waitFor(() => expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    expect(screen.getByRole('button', { name: /page 2/i })).toBeInTheDocument();
  });
});

describe('CommunityForumsPage (authenticated student)', () => {
  it('opens the create discussion dialog and submits a new topic', async () => {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'test-access-token');
    const user = userEvent.setup();
    renderPage(<CommunityForumsPage />, '/community', '*');

    await waitFor(() => expect(screen.getByRole('button', { name: /Start a Discussion/i })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    await user.click(screen.getByRole('button', { name: /Start a Discussion/i }));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByLabelText('Category'));
    await user.click(await screen.findByRole('option', { name: 'General' }));
    await user.type(within(dialog).getByLabelText(/Title/i), 'A brand new question');
    await user.type(within(dialog).getByLabelText(/Description/i), 'Details about my brand new question');
    await user.click(within(dialog).getByRole('button', { name: /Publish Discussion/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), { timeout: LONG_TIMEOUT });
  });

  it('refetches the discussion list after creating a topic', async () => {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'test-access-token');
    let listCalls = 0;
    server.use(
      http.get('/api/v1/forum', () => {
        listCalls += 1;
        return success({
          discussions: listCalls > 1 ? [communityTopic, communityTopicSolved, communityTopicLocked] : [communityTopic],
          pagination: { page: 1, pages: 1, total: listCalls > 1 ? 3 : 1, limit: 10 },
        });
      })
    );
    const user = userEvent.setup();
    renderPage(<CommunityForumsPage />, '/community', '*');

    await waitFor(() => expect(screen.getByText(communityTopic.title)).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
    const callsAfterInitialLoad = listCalls;

    await user.click(screen.getByRole('button', { name: /Start a Discussion/i }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByLabelText('Category'));
    await user.click(await screen.findByRole('option', { name: 'General' }));
    await user.type(within(dialog).getByLabelText(/Title/i), 'Another question');
    await user.type(within(dialog).getByLabelText(/Description/i), 'More details');
    await user.click(within(dialog).getByRole('button', { name: /Publish Discussion/i }));

    await waitFor(() => expect(listCalls).toBeGreaterThan(callsAfterInitialLoad), { timeout: LONG_TIMEOUT });
  });
});

describe('CommunityTopicPage (guest)', () => {
  it('renders topic detail, content and replies', async () => {
    renderPage(<CommunityTopicPage />, `/community/${communityTopic._id}`, '/community/:id');

    await waitFor(() => expect(screen.getByRole('heading', { name: communityTopic.title })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    expect(screen.getByText(communityTopic.content)).toBeInTheDocument();
    expect(screen.getAllByText('Test Author').length).toBeGreaterThan(0);
    expect(screen.getByText(/Sign in to reply/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to Community/i })).toHaveAttribute('href', '/community');
  });

  it('shows a not-found state for a missing discussion', async () => {
    renderPage(<CommunityTopicPage />, '/community/not-found', '/community/:id');
    await waitFor(() => expect(screen.getByText(/Discussion not found/i)).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
  });

  it('renders an error state when the request fails', async () => {
    server.use(http.get('/api/v1/forum/:topicId', () => failure('Server error', 500)));
    renderPage(<CommunityTopicPage />, `/community/${communityTopic._id}`, '/community/:id');
    await waitFor(() => expect(screen.getByText(/Couldn't load this discussion/i)).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
  });

  it('shows a locked notice and hides the composer for locked discussions', async () => {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'test-access-token');
    renderPage(<CommunityTopicPage />, `/community/${communityTopicLocked._id}`, '/community/:id');
    await waitFor(() => expect(screen.getByText(/This discussion is locked/i)).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
  });
});

describe('CommunityTopicPage (authenticated student)', () => {
  it('shows solve and delete actions for the topic owner', async () => {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'test-access-token');
    server.use(
      http.get('/api/v1/users/me', () =>
        success(buildUserWithRole('student', { _id: 'author-1', name: 'Test Author' }))
      )
    );
    renderPage(<CommunityTopicPage />, `/community/${communityTopic._id}`, '/community/:id');

    await waitFor(() => expect(screen.getByRole('heading', { name: communityTopic.title })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    expect(screen.getByRole('button', { name: /Mark as solved/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Delete/i }).length).toBeGreaterThan(0);
  });

  it('allows posting a reply', async () => {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'test-access-token');
    const user = userEvent.setup();
    renderPage(<CommunityTopicPage />, `/community/${communityTopic._id}`, '/community/:id');

    await waitFor(() => expect(screen.getByRole('heading', { name: communityTopic.title })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    await user.type(screen.getByLabelText(/Post a reply/i), 'Thanks for sharing this!');
    await user.click(screen.getByRole('button', { name: /Post Reply/i }));
    await waitFor(() => expect(screen.getByText(/Reply posted/i)).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
  });
});

describe('CommunityTopicPage (authenticated instructor)', () => {
  it('shows best-answer controls and hides them for students', async () => {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'test-access-token');
    server.use(
      http.get('/api/v1/users/me', () =>
        success(
          buildUserWithRole('instructor', { _id: 'instructor-1', name: 'Instructor User' })
        )
      )
    );
    renderPage(<CommunityTopicPage />, `/community/${communityTopicSolved._id}`, '/community/:id');

    await waitFor(() => expect(screen.getByText('Best answer')).toBeInTheDocument(), { timeout: LONG_TIMEOUT });
    expect(screen.getByRole('button', { name: /Remove best answer/i })).toBeInTheDocument();
  });
});

describe('CommunityTopicPage (authenticated admin)', () => {
  it('shows pin, lock and delete controls', async () => {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'test-access-token');
    server.use(
      http.get('/api/v1/users/me', () => success(buildUserWithRole('admin', { _id: 'admin-1', name: 'Admin User' })))
    );
    renderPage(<CommunityTopicPage />, `/community/${communityTopic._id}`, '/community/:id');

    await waitFor(() => expect(screen.getByRole('heading', { name: communityTopic.title })).toBeInTheDocument(), {
      timeout: LONG_TIMEOUT,
    });
    expect(screen.getByRole('button', { name: /Pin/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lock/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Delete/i }).length).toBeGreaterThan(0);
  });
});
