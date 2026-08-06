import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { useToast } from '@/providers/ToastProvider';
import { cn } from '@/lib/utils';

interface ShareButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  title?: string;
  text?: string;
  url?: string;
  label?: string;
}

/**
 * Shares the current page via the native Web Share API when available,
 * falling back to copying the URL to the clipboard.
 */
export function ShareButton({ title, text, url, label = 'Share', className, ...rest }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '');

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        addToast({ title: 'Shared', variant: 'success' });
      } catch {
        // user dismissed the share sheet — no feedback needed
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      addToast({ title: 'Link copied to clipboard', variant: 'success' });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast({ title: 'Could not copy link', variant: 'error' });
    }
  };

  return (
    <Button
      variant={copied ? 'secondary' : 'outline'}
      onClick={handleShare}
      className={cn('gap-2', className)}
      aria-live="polite"
      {...rest}
    >
      {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
      {copied ? 'Copied' : label}
    </Button>
  );
}
