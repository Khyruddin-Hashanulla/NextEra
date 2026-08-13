import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '@/components/ui/pagination';

describe('Pagination', () => {
  it('returns null when there is a single page', () => {
    const { container } = render(<Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders page numbers and highlights the current page', () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument();
  });

  it('calls onPageChange when navigating', () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenCalledWith(4);

    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(onPageChange).toHaveBeenCalledWith(2);

    fireEvent.click(screen.getByRole('button', { name: 'Page 5' }));
    expect(onPageChange).toHaveBeenCalledWith(5);
  });

  it('disables previous on the first page', () => {
    render(<Pagination currentPage={1} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
  });

  it('disables next on the last page', () => {
    render(<Pagination currentPage={3} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('renders ellipses for a large page count', () => {
    render(<Pagination currentPage={10} totalPages={20} onPageChange={vi.fn()} />);
    expect(screen.getAllByText('...').length).toBeGreaterThan(0);
  });

  it('hides page numbers when disabled', () => {
    render(<Pagination currentPage={2} totalPages={4} onPageChange={vi.fn()} showPageNumbers={false} />);
    expect(screen.queryByRole('button', { name: /Page \d/ })).not.toBeInTheDocument();
  });
});
