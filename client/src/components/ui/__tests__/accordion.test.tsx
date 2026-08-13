import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

describe('Accordion', () => {
  const user = userEvent.setup();

  function renderAccordion() {
    render(
      <Accordion type="single" collapsible defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger>Is it accessible?</AccordionTrigger>
          <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Is it unstyled?</AccordionTrigger>
          <AccordionContent>Yes. It's unstyled by default.</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  it('renders the headers and default-open content', () => {
    renderAccordion();
    expect(screen.getByRole('button', { name: 'Is it accessible?' })).toBeInTheDocument();
    expect(screen.getByText('Yes. It adheres to the WAI-ARIA design pattern.')).toBeInTheDocument();
    expect(screen.queryByText("Yes. It's unstyled by default.")).not.toBeInTheDocument();
  });

  it('opens a collapsed item on click', async () => {
    renderAccordion();
    await user.click(screen.getByRole('button', { name: 'Is it unstyled?' }));
    expect(screen.getByText("Yes. It's unstyled by default.")).toBeInTheDocument();
  });

  it('collapses the open item when clicked again', async () => {
    renderAccordion();
    await user.click(screen.getByRole('button', { name: 'Is it accessible?' }));
    expect(screen.queryByText('Yes. It adheres to the WAI-ARIA design pattern.')).not.toBeInTheDocument();
  });

  it('uses aria-expanded and aria-controls for accessibility', () => {
    renderAccordion();
    const openTrigger = screen.getByRole('button', { name: 'Is it accessible?' });
    expect(openTrigger).toHaveAttribute('aria-expanded', 'true');
    const controls = openTrigger.getAttribute('aria-controls');
    expect(controls).toBeTruthy();
    expect(document.getElementById(controls!)).toHaveAttribute('role', 'region');
  });

  it('supports multiple open items in "multiple" mode', async () => {
    render(
      <Accordion type="multiple" defaultValue={['item-1']}>
        <AccordionItem value="item-1">
          <AccordionTrigger>One</AccordionTrigger>
          <AccordionContent>Content one</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Two</AccordionTrigger>
          <AccordionContent>Content two</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    await user.click(screen.getByRole('button', { name: 'Two' }));
    expect(screen.getByText('Content one')).toBeInTheDocument();
    expect(screen.getByText('Content two')).toBeInTheDocument();
  });

  it('renders item value attribute', () => {
    renderAccordion();
    const item = document.querySelector('[data-radix-collection-item]');
    expect(item).toBeTruthy();
  });
});
