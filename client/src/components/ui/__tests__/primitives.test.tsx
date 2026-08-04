import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription, AlertIcon } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Skeleton, SkeletonCard, SkeletonTable, SkeletonList, SkeletonText } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCaption } from '@/components/ui/table';

describe('Button', () => {
  it('renders children and applies variants', () => {
    render(<Button variant="destructive" size="lg">Delete</Button>);
    const btn = screen.getByRole('button', { name: 'Delete' });
    expect(btn).toHaveClass('bg-destructive');
    expect(btn).toHaveClass('h-11');
  });

  it('is disabled while loading and marks aria-busy', () => {
    render(<Button loading>Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('fires onClick', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Click' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders a left and right icon', () => {
    render(<Button icon={<span data-testid="l">L</span>} iconPosition="left">Go</Button>);
    render(<Button icon={<span data-testid="r">R</span>} iconPosition="right">Go2</Button>);
    expect(screen.getByTestId('l')).toBeInTheDocument();
    expect(screen.getByTestId('r')).toBeInTheDocument();
  });

  it('respects the disabled prop', () => {
    render(<Button disabled>Off</Button>);
    expect(screen.getByRole('button', { name: 'Off' })).toBeDisabled();
  });

  it('renders as a child element via asChild', () => {
    render(
      <Button asChild>
        <a href="/courses">Link</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Link' });
    expect(link.tagName).toBe('A');
  });
});

describe('Input', () => {
  it('renders and forwards props', () => {
    render(<Input placeholder="Email" data-testid="in" />);
    expect(screen.getByPlaceholderText('Email')).toHaveAttribute('data-testid', 'in');
  });

  it('applies className', () => {
    render(<Input className="extra" />);
    expect(screen.getByRole('textbox')).toHaveClass('extra');
  });
});

describe('Textarea', () => {
  it('renders and accepts a value', () => {
    render(<Textarea defaultValue="hello" />);
    expect(screen.getByRole('textbox')).toHaveValue('hello');
  });
});

describe('Card', () => {
  it('renders the card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Desc</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Desc')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});

describe('Badge', () => {
  it('renders with a variant', () => {
    render(<Badge variant="success">Active</Badge>);
    expect(screen.getByText('Active')).toHaveClass('bg-success/10');
  });
});

describe('Alert', () => {
  it('renders title, description and icon', () => {
    render(
      <Alert variant="destructive">
        <AlertIcon variant="destructive" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something failed</AlertDescription>
      </Alert>,
    );
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something failed')).toBeInTheDocument();
  });
});

describe('Separator', () => {
  it('renders a separator', () => {
    const { container } = render(<Separator />);
    expect(container.querySelector('[data-radix-collection-item]') ?? container.querySelector('div')).toBeTruthy();
  });
});

describe('Label', () => {
  it('renders label text and links to an input', () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <Input id="email" />
      </>,
    );
    expect(screen.getByText('Email')).toHaveAttribute('for', 'email');
  });
});

describe('Skeleton', () => {
  it('renders a skeleton block', () => {
    render(<Skeleton data-testid="sk" />);
    expect(screen.getByTestId('sk')).toHaveClass('animate-pulse');
  });

  it('renders composite skeletons', () => {
    render(
      <>
        <SkeletonCard />
        <SkeletonTable rows={2} columns={3} />
        <SkeletonList items={2} />
        <SkeletonText lines={2} />
      </>,
    );
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });
});

describe('Avatar', () => {
  it('shows the fallback when the image has not loaded', () => {
    render(
      <Avatar>
        <AvatarImage src="https://img.example/a.jpg" alt="Jane" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
});

describe('Progress', () => {
  it('positions the indicator based on the value', () => {
    const { container } = render(<Progress value={60} />);
    const indicator = container.querySelector('[style]');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveStyle('transform: translateX(-40%)');
  });

  it('renders an empty indicator when no value is given', () => {
    const { container } = render(<Progress />);
    expect(container.querySelector('[style]')).toHaveStyle('transform: translateX(-100%)');
  });
});

describe('Switch', () => {
  it('toggles when clicked', () => {
    render(<Switch aria-label="Dark mode" />);
    const sw = screen.getByRole('switch');
    expect(sw).toHaveAttribute('data-state', 'unchecked');
    fireEvent.click(sw);
    expect(sw).toHaveAttribute('data-state', 'checked');
  });
});

describe('Table', () => {
  it('renders a full table', () => {
    render(
      <Table>
        <TableCaption>My table</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Jane</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Jane' })).toBeInTheDocument();
    expect(screen.getByText('My table')).toBeInTheDocument();
  });
});
