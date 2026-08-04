import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { renderWithProviders } from '@/test/render/renderWithProviders';
import { runA11yChecks } from '@/test/utils/a11y';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { HomePage } from '@/features/public/pages/HomePage';
import { CoursesPage } from '@/features/public/pages/CoursesPage';
import { BlogDetailPage } from '@/features/public/pages/BlogDetailPage';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { ToastProvider } from '@/providers/ToastProvider';

function wrap(ui: React.ReactNode, options?: { route?: string }) {
  return renderWithProviders(
    <GoogleOAuthProvider clientId="test-client-id">{ui}</GoogleOAuthProvider>,
    { route: options?.route ?? '/' },
  );
}

describe('Accessibility checks - UI primitives', () => {
  it('Button has no violations', async () => {
    const { container } = wrap(<Button>Click me</Button>);
    const results = await runA11yChecks(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Input has no violations', async () => {
    const { container } = wrap(<Input label="Email" placeholder="you@example.com" />);
    const results = await runA11yChecks(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Card has no violations', async () => {
    const { container } = wrap(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
        </CardHeader>
        <CardContent>Card content</CardContent>
      </Card>,
    );
    const results = await runA11yChecks(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Alert has no violations', async () => {
    const { container } = wrap(<Alert>Alert message</Alert>);
    const results = await runA11yChecks(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Badge has no violations', async () => {
    const { container } = wrap(<Badge>New</Badge>);
    const results = await runA11yChecks(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Dialog has no violations when open', async () => {
    const { container } = wrap(
      <Dialog open>
        <DialogTrigger asChild><button>Open</button></DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    const results = await runA11yChecks(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Select has no violations', async () => {
    const { container } = wrap(
      <Select>
        <SelectTrigger aria-label="Select an option">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
        </SelectContent>
      </Select>,
    );
    const results = await runA11yChecks(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Tabs has no violations', async () => {
    const { container } = wrap(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">Tab A</TabsTrigger>
          <TabsTrigger value="b">Tab B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Content A</TabsContent>
        <TabsContent value="b">Content B</TabsContent>
      </Tabs>,
    );
    const results = await runA11yChecks(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Accordion has no violations', async () => {
    const { container } = wrap(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Question?</AccordionTrigger>
          <AccordionContent>Answer.</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const results = await runA11yChecks(container);
    expect(results.violations).toHaveLength(0);
  });

  it('DropdownMenu has no violations', async () => {
    const { container } = wrap(
      <DropdownMenu>
        <DropdownMenuTrigger asChild><button>Menu</button></DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const results = await runA11yChecks(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Toast has no violations', async () => {
    const { container } = render(
      <ToastProvider>
        <div role="alert" aria-live="polite">
          <div>Toast content</div>
        </div>
      </ToastProvider>,
    );
    const results = await runA11yChecks(container);
    expect(results.violations).toHaveLength(0);
  });

  it('Tooltip has no violations', async () => {
    const { container } = render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild><button>Hover</button></TooltipTrigger>
          <TooltipContent>Tip</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    const results = await runA11yChecks(container);
    expect(results.violations).toHaveLength(0);
  });
});

describe('Accessibility checks - auth forms', () => {
  it('LoginForm has no violations', async () => {
    const { container } = wrap(<LoginForm />);
    const results = await runA11yChecks(container);
    expect(results.violations).toHaveLength(0);
  });

  it('RegisterForm has no violations', async () => {
    const { container } = wrap(<RegisterForm />);
    const results = await runA11yChecks(container);
    expect(results.violations).toHaveLength(0);
  });
});

describe('Accessibility checks - public pages', () => {
  it('HomePage has no violations', async () => {
    const { container } = wrap(<HomePage />, { route: '/' });
    const results = await runA11yChecks(container);
    expect(results.violations).toHaveLength(0);
  });

  it('CoursesPage has no violations', async () => {
    const { container } = wrap(<CoursesPage />, { route: '/courses' });
    const results = await runA11yChecks(container);
    expect(results.violations).toHaveLength(0);
  });

  it('BlogDetailPage has no violations', async () => {
    const { container } = wrap(<BlogDetailPage />, { route: '/blog/learning-insight-1' });
    const results = await runA11yChecks(container);
    expect(results.violations).toHaveLength(0);
  });
});