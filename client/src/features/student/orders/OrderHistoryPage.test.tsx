import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse, delay } from 'msw';
import { server } from '@/test/mocks/server';
import { renderWithProviders } from '@/test/render/renderWithProviders';
import { buildUserWithRole } from '@/test/factories';
import { OrderHistoryPage } from '@/features/student/pages/OrderHistoryPage';
import { openRazorpayCheckout } from '@/lib/razorpay';

vi.mock('@/lib/razorpay', () => ({
  loadRazorpayScript: vi.fn(async () => true),
  openRazorpayCheckout: vi.fn(async () => true),
}));

const payments = [
  {
    _id: 'p1',
    course: { _id: 'c1', title: 'React Masterclass', thumbnail: { url: 'https://img.example/react.jpg' } },
    type: 'course',
    amount: 1999,
    currency: 'INR',
    status: 'success',
    paymentMethod: 'upi',
    razorpayOrderId: 'order_P1LONGID1234567890',
    createdAt: '2026-01-10T00:00:00.000Z',
  },
  {
    _id: 'p2',
    bundle: { _id: 'b1', title: 'Full Stack Bundle' },
    type: 'bundle',
    amount: 3999,
    status: 'pending',
    pendingReason: 'Awaiting bank confirmation',
    createdAt: '2026-01-12T00:00:00.000Z',
  },
  {
    _id: 'p3',
    subscription: { _id: 's1', name: 'Premium Plan' },
    type: 'subscription',
    amount: 499,
    status: 'failed',
    failureDetails: { failureReason: 'Card declined', cardLast4: '1234' },
    createdAt: '2026-01-15T00:00:00.000Z',
  },
];

let listResponse: { payments: typeof payments; total: number; page: number; totalPages: number };

function seedOrders(overrides: Partial<typeof listResponse> = {}) {
  listResponse = { payments, total: payments.length, page: 1, totalPages: 1, ...overrides };
  server.use(
    http.get('/api/v1/student/payments', ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page') || '1');
      return HttpResponse.json({ success: true, data: { ...listResponse, page } });
    }),
    http.get('/api/v1/student/payments/:id', () =>
      HttpResponse.json({ success: true, data: payments.find((p) => p._id === 'p1') })
    )
  );
}

function renderPage() {
  return renderWithProviders(<OrderHistoryPage />, { user: buildUserWithRole('student') });
}

describe('OrderHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
  });

  it('renders the header and order cards', async () => {
    seedOrders();
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Orders' })).toBeInTheDocument();
    expect(await screen.findByText('React Masterclass')).toBeInTheDocument();
    expect(screen.getByText('Full Stack Bundle')).toBeInTheDocument();
    expect(screen.getByText('Premium Plan')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('₹1,999')).toBeInTheDocument();
  });

  it('shows a skeleton while loading', async () => {
    server.use(
      http.get('/api/v1/student/payments', async () => {
        await delay(1000);
        return HttpResponse.json({ success: true, data: { payments: [], total: 0, page: 1, totalPages: 1 } });
      })
    );
    renderPage();

    expect(screen.getByRole('status', { name: 'Loading your orders' })).toBeInTheDocument();
  });

  it('shows an empty state when there are no orders', async () => {
    seedOrders({ payments: [], total: 0, totalPages: 1 });
    renderPage();

    expect(await screen.findByText('No orders yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse Courses' })).toHaveAttribute('href', '/courses');
  });

  it('shows an error state and retries successfully', async () => {
    server.use(
      http.get('/api/v1/student/payments', () =>
        HttpResponse.json({ success: false, message: 'boom' }, { status: 500 })
      )
    );
    renderPage();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    const retry = screen.getByRole('button', { name: 'Try Again' });

    seedOrders();
    fireEvent.click(retry);

    expect(await screen.findByText('React Masterclass')).toBeInTheDocument();
  });

  it('paginates when there are multiple pages', async () => {
    seedOrders({ payments, total: 15, page: 1, totalPages: 2 });
    renderPage();

    expect(await screen.findByRole('button', { name: 'Next page' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled());
  });

  it('opens order details from the details action', async () => {
    seedOrders();
    renderPage();

    await screen.findByText('React Masterclass');
    fireEvent.click(screen.getByRole('button', { name: 'View details for React Masterclass' }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(await screen.findByText('order_P1LONGID1234567890')).toBeInTheDocument();
    expect(screen.getByText(/Payment Method/)).toBeInTheDocument();
  });

  it('fires the retry endpoint when retrying a failed order', async () => {
    let retryCalled = false;
    server.use(
      http.post('/api/v1/student/payments/:id/retry', () => {
        retryCalled = true;
        return HttpResponse.json({
          success: true,
          data: { key: 'rzp_test', amount: 499, currency: 'INR', orderId: 'order_RETRY1' },
        });
      })
    );
    seedOrders();
    renderPage();

    await screen.findByText('Premium Plan');
    fireEvent.click(screen.getByRole('button', { name: 'Retry payment for Premium Plan' }));

    await waitFor(() => expect(retryCalled).toBe(true));
    expect(openRazorpayCheckout).toHaveBeenCalledTimes(1);
  });
});