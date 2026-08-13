import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';

describe('DropdownMenu', () => {
  const user = userEvent.setup();

  it('opens the menu on trigger click and shows items', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>Open menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const menu = await screen.findByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('invokes onSelect when an item is clicked', async () => {
    const onSelect = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>Open menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onSelect}>Profile</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(await screen.findByText('Profile'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('renders label, separator, and shortcut', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>Open menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            Profile <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await screen.findByRole('menu');
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(document.querySelector('[role="separator"]')).toBeInTheDocument();
    expect(screen.getByText('⌘P')).toBeInTheDocument();
  });

  it('handles checkbox items and toggles checked state', async () => {
    const onCheckedChange = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>Open menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked onCheckedChange={onCheckedChange}>
            Show avatars
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(await screen.findByRole('menuitemcheckbox'));
    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it('handles radio items in a radio group', async () => {
    const onValueChange = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>Open menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="small" onValueChange={onValueChange}>
            <DropdownMenuRadioItem value="small">Small</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="large">Large</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Large' }));
    expect(onValueChange).toHaveBeenCalledWith('large');
  });

  it('closes the menu after selecting an item', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>Open menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Profile</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await screen.findByRole('menu');
    await user.click(screen.getByText('Profile'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
