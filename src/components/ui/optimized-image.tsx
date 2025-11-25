import { useState } from 'react';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  objectFit = 'cover',
  ...props
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [ref, isVisible] = useIntersectionObserver({
    freezeOnceVisible: true,
    rootMargin: '100px'
  });

  const shouldLoad = priority || isVisible;

  // Generate WebP/AVIF sources if it's a valid image URL
  const getOptimizedSources = (originalSrc: string) => {
    // Skip data URLs and external URLs
    if (originalSrc.startsWith('data:') || originalSrc.startsWith('http')) {
      return null;
    }

    const srcWithoutExt = originalSrc.replace(/\.[^.]+$/, '');
    return {
      avif: `${srcWithoutExt}.avif`,
      webp: `${srcWithoutExt}.webp`,
      original: originalSrc
    };
  };

  const sources = getOptimizedSources(src);

  if (hasError) {
    return (
      <div 
        ref={ref}
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          className
        )}
        style={{ width, height }}
      >
        <span className="text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div 
      ref={ref}
      className={cn("relative overflow-hidden bg-muted", className)}
      style={{ width, height }}
    >
      {/* Placeholder blur */}
      {!isLoaded && shouldLoad && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted to-muted-foreground/10" />
      )}

      {shouldLoad && (
        <>
          {sources ? (
            <picture>
              <source type="image/avif" srcSet={sources.avif} />
              <source type="image/webp" srcSet={sources.webp} />
              <img
                src={sources.original}
                alt={alt}
                width={width}
                height={height}
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                onLoad={() => setIsLoaded(true)}
                onError={() => setHasError(true)}
                className={cn(
                  "transition-opacity duration-300",
                  isLoaded ? "opacity-100" : "opacity-0",
                  `object-${objectFit} w-full h-full`
                )}
                {...props}
              />
            </picture>
          ) : (
            <img
              src={src}
              alt={alt}
              width={width}
              height={height}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              onLoad={() => setIsLoaded(true)}
              onError={() => setHasError(true)}
              className={cn(
                "transition-opacity duration-300",
                isLoaded ? "opacity-100" : "opacity-0",
                `object-${objectFit} w-full h-full`
              )}
              {...props}
            />
          )}
        </>
      )}
    </div>
  );
};
