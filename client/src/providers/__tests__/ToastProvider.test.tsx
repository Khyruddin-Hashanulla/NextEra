import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { type ReactNode } from 'react';
import { ToastProvider, useToast } from '@/providers/ToastProvider';

function Consumer() {
  const { toasts, addToast, removeToast } = useToast();
  return (
    <div>
      <button onClick={() => addToast({ title: 'Saved', variant: 'success' })}>add</button>
      <button onClick={() => addToast({ title: 'With description', description: 'details', variant: 'error' })}>
        add-desc
      </button>
      <ul>
        {toasts.map((t) => (
          <li key={t.id}>
            <span>toast-{t.id}</span>
            <button onClick={() => removeToast(t.id)}>close {t.id}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function wrapper({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds a toast and auto-dismisses it after 5 seconds', () => {
    render(<Consumer />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'add' }));
    expect(screen.getByText('Saved')).toBeInTheDocument();

    actTimers(4999);
    expect(screen.getByText('Saved')).toBeInTheDocument();

    actTimers(1);
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });
  it('renders the description when provided', () => {
    render(<Consumer />, { wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'add-desc' }));
    expect(screen.getByText('With description')).toBeInTheDocument();
    expect(screen.getByText('details')).toBeInTheDocument();
  });

  it('removes a toast via removeToast', () => {
    render(<Consumer />, { wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'add' }));

    const close = screen.getByRole('button', { name: /close/ });
    fireEvent.click(close);
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('marks the container as a polite live region', () => {
    render(<Consumer />, { wrapper });
    const region = screen.getByRole('region', { name: 'Notifications' });
    expect(region).toHaveAttribute('aria-live', 'polite');
  });

  it('exposes removeToast for keyboard dismissal', () => {
    render(<Consumer />, { wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'add' }));
    const toast = screen.getByRole('alert');
    fireEvent.keyDown(toast, { key: 'Enter' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

function actTimers(ms: number) {
  act(() => vi.advanceTimersByTime(ms));
}
