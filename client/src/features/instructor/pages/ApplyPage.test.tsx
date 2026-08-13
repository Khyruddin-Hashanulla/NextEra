import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ApplyPage } from './ApplyPage';

const { getApplicationStatus } = vi.hoisted(() => ({
  getApplicationStatus: vi.fn(),
}));

const { currentRole } = vi.hoisted(() => ({ currentRole: { value: 'student' } }));

vi.mock('@/api/endpoints/instructor', () => ({
  instructorApi: { getApplicationStatus: getApplicationStatus },
}));

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({ user: { role: currentRole.value } }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial: _i, animate: _a, transition: _t, ...props }: any) => <div {...props}>{children}</div>,
  },
  useReducedMotion: () => false,
}));

vi.mock('../components/apply/ApplicationForm', () => ({
  ApplicationForm: () => <div>APPLICATION_FORM_STUB</div>,
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ApplyPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ApplyPage', () => {
  beforeEach(() => {
    getApplicationStatus.mockReset();
    getApplicationStatus.mockResolvedValue({
      data: { data: { applied: true, status: 'approved', application: {} } },
    });
    currentRole.value = 'student';
  });

  it('shows the revoked state when the application is approved but the role is no longer instructor', async () => {
    renderPage();

    expect(await screen.findByText(/You are currently a Student\./i)).toBeInTheDocument();
    expect(screen.getByText(/revoked by the administrator/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apply Again/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Contact Administrator/i })).toBeInTheDocument();

    expect(screen.queryByText(/Go to Instructor Dashboard/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Browse Courses/i)).not.toBeInTheDocument();
  });

  it('shows the approved state when the application is approved and the role is instructor', async () => {
    currentRole.value = 'instructor';
    renderPage();

    expect(await screen.findByText(/Congratulations! You are now an instructor/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to Instructor Dashboard/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Apply Again/i })).not.toBeInTheDocument();
  });

  it('shows the pending card while the application is under review', async () => {
    getApplicationStatus.mockResolvedValue({
      data: { data: { applied: true, status: 'pending', application: {} } },
    });
    renderPage();

    expect(await screen.findByText(/Your application is being reviewed/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Apply Again/i })).not.toBeInTheDocument();
  });

  it('shows the application form when there is no application', async () => {
    getApplicationStatus.mockResolvedValue({ data: { data: { applied: false } } });
    renderPage();

    expect(await screen.findByText('APPLICATION_FORM_STUB')).toBeInTheDocument();
  });
});
