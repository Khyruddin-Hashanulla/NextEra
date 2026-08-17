import { useId, useState } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FaqAccordionProps {
  question: string;
  answer: string;
  className?: string;
}

/**
 * Premium FAQ accordion card: large readable question, thin bordered glass
 * card, and a circular expand control that cross-fades plus/minus. Built on
 * Radix primitives for keyboard navigation, aria-expanded and unique ids.
 * Each card is its own collapsible root so items open independently.
 */
export function FaqAccordion({ question, answer, className }: FaqAccordionProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <AccordionPrimitive.Root
      type="single"
      collapsible
      value={open ? id : ''}
      onValueChange={(value) => setOpen(value === id)}
      className={cn('w-full', className)}
    >
      <AccordionPrimitive.Item
        value={id}
        className={cn(
          'rounded-2xl border bg-card/50 shadow-sm backdrop-blur-sm transition-colors duration-300',
          open ? 'border-primary/40' : 'border-border/60 hover:border-primary/30'
        )}
      >
        <AccordionPrimitive.Header>
          <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-6 sm:py-6">
            <span className="text-body font-medium text-foreground text-balance sm:text-lg">{question}</span>
            <span
              aria-hidden="true"
              className={cn(
                'relative h-9 w-9 shrink-0 overflow-hidden rounded-full border transition-colors duration-300',
                open
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-muted/50 text-foreground group-hover:border-primary group-hover:bg-primary/10 group-hover:text-primary'
              )}
            >
              <Plus
                className={cn(
                  'absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 transition-all duration-300',
                  open ? 'scale-75 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
                )}
              />
              <Minus
                className={cn(
                  'absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 transition-all duration-300',
                  open ? 'scale-100 rotate-0 opacity-100' : 'scale-75 -rotate-90 opacity-0'
                )}
              />
            </span>
          </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
        <AccordionPrimitive.Content className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <div className="px-5 pb-6 sm:px-6 sm:pb-7">
            <p className="leading-relaxed text-muted-foreground">{answer}</p>
          </div>
        </AccordionPrimitive.Content>
      </AccordionPrimitive.Item>
    </AccordionPrimitive.Root>
  );
}