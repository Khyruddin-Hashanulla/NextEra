import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectGroup,
} from '@/components/ui/select';

describe('Select', () => {
  const user = userEvent.setup();

  function renderSelect(onValueChange = vi.fn()) {
    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
    return { onValueChange };
  }

  it('renders the trigger with placeholder', () => {
    renderSelect();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Pick a fruit')).toBeInTheDocument();
  });

  it('opens the listbox on trigger click and selects an item', async () => {
    const { onValueChange } = renderSelect();
    await user.click(screen.getByRole('combobox'));
    const listbox = await screen.findByRole('listbox');
    expect(listbox).toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: 'Banana' }));
    expect(onValueChange).toHaveBeenCalledWith('banana');
  });

  it('renders the selected value label after selection', async () => {
    render(
      <Select value="apple">
        <SelectTrigger>
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByRole('combobox')).toHaveTextContent('Apple');
  });

  it('shows items in the listbox with a label group', async () => {
    renderSelect();
    await user.click(screen.getByRole('combobox'));
    await screen.findByRole('listbox');
    expect(screen.getByText('Fruits')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument();
  });

  it('closes the listbox after selecting via keyboard', async () => {
    renderSelect();
    await user.click(screen.getByRole('combobox'));
    await screen.findByRole('listbox');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('marks the selected option as selected', async () => {
    const { onValueChange } = renderSelect();
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'Banana' }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });
});
