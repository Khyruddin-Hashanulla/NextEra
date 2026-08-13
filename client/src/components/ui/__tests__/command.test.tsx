import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';

describe('Command', () => {
  const user = userEvent.setup();

  it('renders the input and item list', () => {
    render(
      <Command>
        <CommandInput placeholder="Search…" />
        <CommandList>
          <CommandGroup heading="Suggestions">
            <CommandItem>Calendar</CommandItem>
            <CommandItem>Search</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    );
    expect(screen.getByPlaceholderText('Search…')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('filters items as the query changes', async () => {
    render(
      <Command>
        <CommandInput placeholder="Search…" />
        <CommandList>
          <CommandGroup heading="Suggestions">
            <CommandItem value="calendar">Calendar</CommandItem>
            <CommandItem value="email">Email</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    );
    await user.type(screen.getByPlaceholderText('Search…'), 'cal');
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.queryByText('Email')).not.toBeInTheDocument();
  });

  it('shows the empty state when nothing matches', async () => {
    render(
      <Command>
        <CommandInput placeholder="Search…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem value="calendar">Calendar</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    );
    await user.type(screen.getByPlaceholderText('Search…'), 'zzzz');
    expect(screen.getByText('No results found.')).toBeInTheDocument();
  });

  it('invokes onSelect when an item is activated', async () => {
    const onSelect = vi.fn();
    render(
      <Command>
        <CommandInput placeholder="Search…" />
        <CommandList>
          <CommandGroup heading="Suggestions">
            <CommandItem value="calendar" onSelect={onSelect}>
              Calendar
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    );
    await user.click(screen.getByText('Calendar'));
    expect(onSelect).toHaveBeenCalledWith('calendar');
  });

  it('renders a separator and shortcut', () => {
    render(
      <Command>
        <CommandList>
          <CommandGroup heading="Edit">
            <CommandItem>
              Copy
              <CommandShortcut>⌘C</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
        </CommandList>
      </Command>
    );
    expect(screen.getByText('⌘C')).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('navigates items with arrow keys and selects with Enter', async () => {
    const onSelect = vi.fn();
    render(
      <Command>
        <CommandInput placeholder="Search…" />
        <CommandList>
          <CommandGroup heading="Suggestions">
            <CommandItem value="one" onSelect={onSelect}>
              One
            </CommandItem>
            <CommandItem value="two" onSelect={onSelect}>
              Two
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    );
    await user.click(screen.getByText('One'));
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenCalledWith('two');
  });
});
