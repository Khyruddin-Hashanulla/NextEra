import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

describe('Sheet', () => {
  const user = userEvent.setup();

  it('renders trigger and keeps the panel hidden when closed', () => {
    render(
      <Sheet>
        <SheetTrigger asChild>
          <button>Open sheet</button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Navigation menu</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <button>Save</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
    expect(screen.getByRole('button', { name: 'Open sheet' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the sheet and renders the header', async () => {
    render(
      <Sheet>
        <SheetTrigger asChild>
          <button>Open sheet</button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Navigation menu</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
    await user.click(screen.getByRole('button', { name: 'Open sheet' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Menu' })).toBeInTheDocument();
  });

  it('closes via the X button', async () => {
    render(
      <Sheet defaultOpen>
        <SheetTrigger asChild>
          <button>Open sheet</button>
        </SheetTrigger>
        <SheetContent>
          <SheetTitle>Menu</SheetTitle>
        </SheetContent>
      </Sheet>
    );
    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('applies a custom className to the content', async () => {
    render(
      <Sheet defaultOpen>
        <SheetContent className="custom-sheet-side">
          <SheetTitle>Menu</SheetTitle>
        </SheetContent>
      </Sheet>
    );
    const content = await screen.findByRole('dialog');
    expect(content.className).toContain('custom-sheet-side');
  });

  it('calls onOpenChange when closed', async () => {
    const onOpenChange = vi.fn();
    render(
      <Sheet defaultOpen onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetTitle>Menu</SheetTitle>
        </SheetContent>
      </Sheet>
    );
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
