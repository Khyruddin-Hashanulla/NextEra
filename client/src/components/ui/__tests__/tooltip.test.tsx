import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

describe('Tooltip', () => {
  const user = userEvent.setup();

  it('does not render the tooltip content by default', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button>Hover me</button>
          </TooltipTrigger>
          <TooltipContent>Useful tip</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(screen.queryByText('Useful tip')).not.toBeInTheDocument();
  });

  it('shows the tooltip on focus of the trigger', async () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button>Hover me</button>
          </TooltipTrigger>
          <TooltipContent>Useful tip</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    await user.tab();
    expect(await screen.findByText('Useful tip')).toBeInTheDocument();
  });

  it('hides the tooltip when focus leaves', async () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button>Hover me</button>
          </TooltipTrigger>
          <TooltipContent>Useful tip</TooltipContent>
        </Tooltip>
        <button>Other</button>
      </TooltipProvider>
    );
    await user.tab();
    await screen.findByText('Useful tip');
    await user.tab();
    expect(screen.queryByText('Useful tip')).not.toBeInTheDocument();
  });

  it('shows the tooltip on hover', async () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button>Hover me</button>
          </TooltipTrigger>
          <TooltipContent>Hover tip</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    await user.hover(screen.getByRole('button', { name: 'Hover me' }));
    expect(await screen.findByText('Hover tip')).toBeInTheDocument();
  });

  it('applies a custom class to the content', async () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button>Hover me</button>
          </TooltipTrigger>
          <TooltipContent className="custom-tooltip">Styled tip</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    await user.hover(screen.getByRole('button', { name: 'Hover me' }));
    const tip = await screen.findByText('Styled tip');
    expect(tip.className).toContain('custom-tooltip');
  });
});
