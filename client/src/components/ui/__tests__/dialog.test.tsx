import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';

function renderDialog(open?: boolean) {
  const user = userEvent.setup();
  const onOpenChange = vi.fn();
  const rootProps = open === undefined ? { onOpenChange } : { open, onOpenChange };
  render(
    <Dialog {...rootProps}>
      <DialogTrigger asChild>
        <button>Open dialog</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Make changes to your profile here.</DialogDescription>
        </DialogHeader>
        <div>Profile form</div>
        <DialogFooter>
          <DialogClose asChild>
            <button>Save</button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  return { user, onOpenChange };
}

describe('Dialog', () => {
  it('renders trigger and keeps content hidden when closed', () => {
    renderDialog(false);
    expect(screen.getByRole('button', { name: 'Open dialog' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens when controlled open is true', () => {
    renderDialog(true);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Edit profile' })).toBeInTheDocument();
    expect(screen.getByText('Make changes to your profile here.')).toBeInTheDocument();
  });

  it('opens on trigger click and closes via the X button', async () => {
    const { user } = renderDialog();
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onOpenChange when the close button is pressed', async () => {
    const { user, onOpenChange } = renderDialog(true);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes on Escape key', async () => {
    const { user, onOpenChange } = renderDialog(true);
    const dialog = screen.getByRole('dialog');
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(dialog).toBeInTheDocument();
  });

  it('keeps the title accessible via aria-labelledby', () => {
    renderDialog(true);
    const dialog = screen.getByRole('dialog');
    const titleId = dialog.getAttribute('aria-labelledby');
    expect(titleId).toBeTruthy();
    expect(document.getElementById(titleId!)).toHaveTextContent('Edit profile');
  });

  it('renders the overlay in a portal when open', () => {
    renderDialog(true);
    const overlay = document.body.querySelector('[data-state="open"].bg-black\\/80, .bg-black\\/80');
    expect(overlay ?? document.body.querySelector('[data-radix-popper-content-wrapper]')).toBeTruthy();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('applies the custom class to the content', () => {
    render(
      <Dialog open>
        <DialogContent className="custom-content-class">
          <DialogTitle>Custom</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    const content = document.body.querySelector('.custom-content-class');
    expect(content).toBeInTheDocument();
  });
});
