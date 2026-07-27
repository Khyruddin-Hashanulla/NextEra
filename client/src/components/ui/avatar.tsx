import * as React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Avatar({ className, children, ...props }: AvatarProps) {
  return (
    <div className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)} {...props}>
      {children}
    </div>
  );
}

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
}

export function AvatarImage({ className, src, alt, ...props }: AvatarImageProps) {
  if (!src) return null;
  return <img src={src} alt={alt || ''} className={cn('aspect-square h-full w-full', className)} {...props} />;
}

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function AvatarFallback({ className, children, ...props }: AvatarFallbackProps) {
  return (
    <div
      className={cn('flex h-full w-full items-center justify-center rounded-full bg-muted text-xs font-medium', className)}
      {...props}
    >
      {children}
    </div>
  );
}
