import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

describe('Tabs', () => {
  const user = userEvent.setup();

  function renderTabs(onValueChange = vi.fn()) {
    render(
      <Tabs defaultValue="account" onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="account">Account settings</TabsContent>
        <TabsContent value="password">Password settings</TabsContent>
      </Tabs>
    );
    return { onValueChange };
  }

  it('renders all triggers and the default tab content', () => {
    renderTabs();
    expect(screen.getByRole('tab', { name: 'Account' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Password' })).toBeInTheDocument();
    expect(screen.getByText('Account settings')).toBeInTheDocument();
    expect(screen.queryByText('Password settings')).not.toBeInTheDocument();
  });

  it('marks the active tab as selected', () => {
    renderTabs();
    expect(screen.getByRole('tab', { name: 'Account' })).toHaveAttribute('data-state', 'active');
    expect(screen.getByRole('tab', { name: 'Password' })).toHaveAttribute('data-state', 'inactive');
  });

  it('switches tab on click and calls onValueChange', async () => {
    const { onValueChange } = renderTabs();
    await user.click(screen.getByRole('tab', { name: 'Password' }));
    expect(onValueChange).toHaveBeenCalledWith('password');
    expect(screen.getByText('Password settings')).toBeInTheDocument();
    expect(screen.queryByText('Account settings')).not.toBeInTheDocument();
  });

  it('navigates with arrow keys', async () => {
    const { onValueChange } = renderTabs();
    const account = screen.getByRole('tab', { name: 'Account' });
    account.focus();
    await user.keyboard('{ArrowRight}');
    expect(onValueChange).toHaveBeenCalledWith('password');
  });

  it('supports controlled active tab', () => {
    render(
      <Tabs value="password">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="account">Account settings</TabsContent>
        <TabsContent value="password">Password settings</TabsContent>
      </Tabs>
    );
    expect(screen.getByText('Password settings')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Tabs defaultValue="a">
        <TabsList className="custom-list">
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
        <TabsContent value="a">A content</TabsContent>
      </Tabs>
    );
    expect(container.querySelector('.custom-list')).toBeInTheDocument();
  });
});
