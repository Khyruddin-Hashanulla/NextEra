import { memo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { BookOpen, User, Image, QrCode } from 'lucide-react';

type PlaceholderType = 'course' | 'avatar' | 'blog' | 'qrcode' | 'general';

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'loading' | 'decoding'> {
  src: string;
  alt: string;
  placeholderType?: PlaceholderType;
  aspectRatio?: string;
  containerClassName?: string;
  lazy?: boolean;
  fetchPriority?: 'high' | 'low' | 'auto';
  width?: number;
  height?: number;
}

function optimizeCloudinaryUrl(url: string): string {
  if (!url || !url.includes('cloudinary.com')) return url;
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;
  const before = url.slice(0, uploadIndex + 8);
  const after = url.slice(uploadIndex + 8);
  const transformations = 'f_auto,q_auto,w_auto';
  if (after.startsWith('v')) {
    const nextSlash = after.indexOf('/');
    if (nextSlash === -1) return `${before}${transformations}/${after}`;
    return `${before}${transformations}/${after}`;
  }
  return `${before}${transformations}/${after}`;
}

const placeholderIcon: Record<PlaceholderType, typeof BookOpen> = {
  course: BookOpen,
  avatar: User,
  blog: BookOpen,
  qrcode: QrCode,
  general: Image,
};

const placeholderBg: Record<PlaceholderType, string> = {
  course: 'bg-muted',
  avatar: 'bg-muted',
  blog: 'bg-muted',
  qrcode: 'bg-white',
  general: 'bg-muted',
};

const placeholderColor: Record<PlaceholderType, string> = {
  course: 'text-muted-foreground/40',
  avatar: 'text-muted-foreground/40',
  blog: 'text-muted-foreground/40',
  qrcode: 'text-muted-foreground/40',
  general: 'text-muted-foreground/40',
};

function OptimizedImageComponent({
  src,
  alt,
  placeholderType = 'general',
  aspectRatio,
  className,
  containerClassName,
  lazy = true,
  fetchPriority,
  width,
  height,
  ...rest
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [shimmer, setShimmer] = useState(true);

  const optimizedSrc = optimizeCloudinaryUrl(src);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    setShimmer(false);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
    setShimmer(false);
  }, []);

  const isDecorative = !alt || alt === '';
  const PlaceholderIcon = placeholderIcon[placeholderType];

  const img = (
    <img
      src={optimizedSrc}
      alt={alt}
      loading={lazy ? 'lazy' : 'eager'}
      decoding="async"
      fetchPriority={fetchPriority}
      onLoad={handleLoad}
      onError={handleError}
      width={width}
      height={height}
      aria-hidden={isDecorative ? true : undefined}
      className={cn(
        'w-full h-full',
        loaded ? 'opacity-100' : 'opacity-0',
        'transition-opacity duration-300',
        className,
      )}
      {...rest}
    />
  );

  if (error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center',
          placeholderBg[placeholderType],
          placeholderColor[placeholderType],
          aspectRatio ? `aspect-[${aspectRatio}]` : '',
          className,
        )}
        style={aspectRatio ? { aspectRatio } : undefined}
        aria-hidden={isDecorative ? true : undefined}
        role={isDecorative ? undefined : 'img'}
        aria-label={isDecorative ? undefined : `Failed to load image: ${alt}`}
      >
        <PlaceholderIcon className="h-8 w-8 sm:h-10 sm:w-10" />
      </div>
    );
  }

  return (
    <div
      className={cn('relative overflow-hidden', placeholderBg[placeholderType], containerClassName)}
      style={{
        ...(aspectRatio ? { aspectRatio } : {}),
        ...(width && height ? { width, height } : {}),
      }}
    >
      {shimmer && (
        <div
          className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/5"
          aria-hidden="true"
        />
      )}
      {img}
    </div>
  );
}

export const OptimizedImage = memo(OptimizedImageComponent);
