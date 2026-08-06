import { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InstructorApplicationReviewModal } from '../InstructorApplicationReviewModal';

const { getDetail, approve, reject, addToast } = vi.hoisted(() => ({
  getDetail: vi.fn(),
  approve: vi.fn(),
  reject: vi.fn(),
  addToast: vi.fn(),
}));

vi.mock('@/api/endpoints/admin', () => ({
  adminApi: {
    getInstructorApplicationDetail: getDetail,
    approveInstructor: approve,
    rejectInstructor: reject,
  },
}));

vi.mock('@/providers/ToastProvider', () => ({
  useToast: () => ({ addToast }),
}));

const mockApp = {
  _id: 'application-01',
  user: { _id: 'instructor-03', name: 'Fatima Rahman', email: 'fatima.rahman@example.com', avatar: null, isEmailVerified: true, isActive: true, isDeleted: false },
  fullName: 'Fatima Rahman',
  email: 'fatima.rahman@example.com',
  phone: '+91 98765 43210',
  address: 'Hitech City, Hyderabad, India',
  photo: { url: null },
  resume: { url: null },
  identityProof: { url: null },
  demoVideo: null,
  qualification: 'M.Tech in Computer Science',
  experience: 'Six years of experience.',
  linkedin: null,
  github: null,
  portfolio: null,
  website: null,
  bio: null,
  teachingCategories: [],
  taxDetails: null,
  bankDetails: null,
  status: 'pending',
  createdAt: '2026-07-16T11:00:00Z',
  updatedAt: '2026-07-16T11:00:00Z',
};

// Force Radix `Presence` to take the exit-animation path so closing a dialog
// suspends unmount until an `animationend` event is dispatched (browser-like).
const realGetComputedStyle = window.getComputedStyle;
function forceExitAnimations() {
  vi.spyOn(window, 'getComputedStyle').mockImplementation(((el: Element) => {
    const readState = () => (el as HTMLElement).getAttribute?.('data-state');
    if (readState()) {
      return {
        display: 'block',
        get animationName() {
          return readState() === 'closed' ? 'exit' : 'enter';
        },
      } as unknown as CSSStyleDeclaration;
    }
    return realGetComputedStyle(el);
  }) as typeof window.getComputedStyle);
}

function fireExitAnimation(el: HTMLElement) {
  const event = new Event('animationend', { bubbles: false });
  Object.defineProperty(event, 'animationName', { value: 'exit' });
  act(() => {
    el.dispatchEvent(event);
  });
}

const dialogs = () => Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]'));
const mainDialogEl = () => dialogs().find((el) => el.textContent?.includes('Review Application'));
const confirmDialogEl = () => dialogs().find((el) => el.textContent?.includes('Approve application'));
const overlays = () =>
  Array.from(document.querySelectorAll<HTMLElement>('div[data-state]')).filter((el) =>
    el.className.includes('bg-black/80')
  );

describe('InstructorApplicationReviewModal', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    getDetail.mockResolvedValue({ data: { data: mockApp } });
    approve.mockResolvedValue({ data: { data: mockApp } });
    reject.mockResolvedValue({ data: { data: mockApp } });
    forceExitAnimations();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function renderHarness(onOpenChange: (open: boolean) => void) {
    function Harness() {
      const [id, setId] = useState<string | null>('application-01');
      return (
        <QueryClientProvider client={queryClient}>
          <InstructorApplicationReviewModal
            applicationId={id}
            onOpenChange={(open) => {
              onOpenChange(open);
              if (!open) setId(null);
            }}
          />
        </QueryClientProvider>
      );
    }
    return render(<Harness />);
  }

  it('opens the confirm dialog stacked over the review dialog', async () => {
    renderHarness(() => {});
    await screen.findByText('Fatima Rahman');

    const review = mainDialogEl()!;
    expect(review).toBeDefined();

    fireEvent.click(within(review).getByRole('button', { name: 'Approve' }));

    const confirm = confirmDialogEl()!;
    expect(confirm).toBeDefined();
    expect(dialogs()).toHaveLength(2);
    expect(overlays()).toHaveLength(2);
  });

  it('fully tears down confirm + review dialogs and every overlay after approve success', async () => {
    const onOpenChange = vi.fn();
    renderHarness(onOpenChange);
    await screen.findByText('Fatima Rahman');

    fireEvent.click(within(mainDialogEl()!).getByRole('button', { name: 'Approve' }));
    fireEvent.click(within(confirmDialogEl()!).getByRole('button', { name: 'Approve' }));

    await waitFor(() => expect(approve).toHaveBeenCalledWith('application-01', ''));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    await waitFor(() => expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'success' })));

    // Exit animations are suspended, so both dialogs are still mounted.
    expect(dialogs()).toHaveLength(2);
    expect(overlays()).toHaveLength(2);

    // Only the review dialog finishes its exit. The nested confirm portal must
    // be torn down with it even though the confirm dialog never fired
    // animationend itself (the browser bug this regression guards against).
    fireExitAnimation(mainDialogEl()!);
    fireExitAnimation(overlays()[0]);

    await waitFor(() => {
      expect(dialogs()).toHaveLength(0);
      expect(overlays()).toHaveLength(0);
    });
  });

  it('fully tears down all dialogs and overlays after reject success', async () => {
    renderHarness(() => {});
    await screen.findByText('Fatima Rahman');

    fireEvent.click(within(mainDialogEl()!).getByRole('button', { name: 'Reject' }));

    const rejectDialog = dialogs().find((el) => el.textContent?.includes('Reject application'))!;
    fireEvent.change(within(rejectDialog).getByLabelText('Rejection reason'), {
      target: { value: 'Missing qualification' },
    });
    fireEvent.click(within(rejectDialog).getByRole('button', { name: 'Reject' }));

    await waitFor(() => expect(reject).toHaveBeenCalledWith('application-01', 'Missing qualification'));

    fireExitAnimation(mainDialogEl()!);
    fireExitAnimation(overlays()[0]);

    await waitFor(() => {
      expect(dialogs()).toHaveLength(0);
      expect(overlays()).toHaveLength(0);
    });
  });

  it('cancel in the confirm dialog keeps the review dialog open and functional', async () => {
    const onOpenChange = vi.fn();
    renderHarness(onOpenChange);
    await screen.findByText('Fatima Rahman');

    fireEvent.click(within(mainDialogEl()!).getByRole('button', { name: 'Approve' }));
    fireEvent.click(within(confirmDialogEl()!).getByRole('button', { name: 'Cancel' }));

    // Confirm dialog closes (after its exit animation), review stays open.
    fireExitAnimation(confirmDialogEl()!);
    fireExitAnimation(overlays()[1]);

    await waitFor(() => {
      expect(dialogs()).toHaveLength(1);
      expect(dialogs()[0].textContent).toContain('Review Application');
    });
    expect(onOpenChange).not.toHaveBeenCalledWith(false);

    // Review dialog can still be closed normally.
    fireEvent.click(within(dialogs()[0]).getByRole('button', { name: 'Close' }));
    fireExitAnimation(mainDialogEl()!);
    fireExitAnimation(overlays()[0]);

    await waitFor(() => {
      expect(dialogs()).toHaveLength(0);
      expect(overlays()).toHaveLength(0);
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
