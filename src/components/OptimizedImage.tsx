import { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  priority?: boolean;
  width?: number;
  onLoad?: () => void;
}

// Transform Supabase Storage URLs to use built-in image transformation
// Docs: https://supabase.com/docs/guides/storage/serving/image-transformations
function getOptimizedSrc(url: string, width = 600): string {
  if (!url) return url;

  try {
    // Handle Supabase storage URLs
    if (url.includes('/storage/v1/object/public/')) {
      const transformed = url.replace(
        '/storage/v1/object/public/',
        '/storage/v1/render/image/public/'
      );
      const separator = transformed.includes('?') ? '&' : '?';
      return `${transformed}${separator}width=${width}&quality=80&format=webp`;
    }

    // Handle Pexels URLs — they support query params natively
    if (url.includes('pexels.com')) {
      const base = url.split('?')[0];
      return `${base}?auto=compress&cs=tinysrgb&w=${width}`;
    }
  } catch {
    // fallback to original
  }

  return url;
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  aspectRatio = '3/4',
  priority = false,
  width = 600,
  onLoad,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '100px' }
    );

    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [priority]);

  const optimizedSrc = getOptimizedSrc(src, width);

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden bg-gray-200 dark:bg-gray-800 ${className}`}
      style={{ aspectRatio }}
    >
      {/* Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800" />
      )}

      {isInView && (
        <img
          src={optimizedSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => { setIsLoaded(true); onLoad?.(); }}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}
