'use client';

import { useState, useRef, useEffect } from 'react';
import { imageOptimization } from '@/lib/optimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean; // Preload for above-the-fold images
  sizes?: string; // Responsive sizes attribute
  className?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  lazy?: boolean;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality = 80,
  priority = false,
  sizes = '100vw',
  className = '',
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
  lazy = true,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px', // Start loading 50px before entering viewport
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, priority, isInView]);

  // Preload critical images
  useEffect(() => {
    if (priority && src) {
      imageOptimization.preloadImage(src).catch(console.error);
    }
  }, [priority, src]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  // Generate optimized URLs
  const getOptimizedUrl = (w?: number, h?: number) => {
    return imageOptimization.getOptimizedUrl(src, {
      width: w,
      height: h,
      quality,
      format: 'webp', // Prefer WebP format
    });
  };

  // Generate srcSet for responsive images
  const generateSrcSet = () => {
    if (!width) return undefined;
    
    const sizes = [width, width * 2, width * 3]; // 1x, 2x, 3x for different pixel densities
    return sizes
      .map(size => `${getOptimizedUrl(size)} ${size}w`)
      .join(', ');
  };

  // Placeholder styles
  const placeholderStyle = placeholder === 'blur' && blurDataURL ? {
    backgroundImage: `url(${blurDataURL})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } : {};

  const aspectRatio = width && height ? height / width : undefined;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        aspectRatio: aspectRatio ? `${width}/${height}` : undefined,
        ...placeholderStyle,
      }}
    >
      {/* Placeholder */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          {placeholder === 'blur' && blurDataURL ? (
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `url(${blurDataURL})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(10px)',
                transform: 'scale(1.1)', // Slightly scale to hide blur edges
              }}
            />
          ) : (
            <div className="w-8 h-8 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
          )}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-400">
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-xs">Failed to load</p>
          </div>
        </div>
      )}

      {/* Main image */}
      {isInView && (
        <img
          ref={imgRef}
          src={getOptimizedUrl(width, height)}
          srcSet={generateSrcSet()}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}

      {/* WebP support fallback */}
      {isInView && (
        <picture className="hidden">
          <source
            srcSet={generateSrcSet()}
            sizes={sizes}
            type="image/webp"
          />
          <source
            srcSet={imageOptimization.generateSrcSet(src, width ? [width, width * 2] : [800, 1200])}
            sizes={sizes}
            type="image/jpeg"
          />
        </picture>
      )}
    </div>
  );
}

// Prebuilt component variants for common use cases
export const AvatarImage = ({ src, alt, size = 40 }: { src: string; alt: string; size?: number }) => (
  <OptimizedImage
    src={src}
    alt={alt}
    width={size}
    height={size}
    quality={90}
    className="rounded-full"
    priority={size <= 64} // Prioritize small avatars as they're usually above fold
  />
);

export const HeroImage = ({ src, alt }: { src: string; alt: string }) => (
  <OptimizedImage
    src={src}
    alt={alt}
    width={1200}
    height={600}
    quality={85}
    priority={true} // Hero images are always priority
    sizes="100vw"
    placeholder="blur"
    className="w-full h-96 object-cover"
  />
);

export const ThumbnailImage = ({ src, alt }: { src: string; alt: string }) => (
  <OptimizedImage
    src={src}
    alt={alt}
    width={300}
    height={200}
    quality={75}
    lazy={true}
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    className="w-full h-48 object-cover rounded-lg"
  />
);

export const ProfileImage = ({ src, alt }: { src: string; alt: string }) => (
  <OptimizedImage
    src={src}
    alt={alt}
    width={400}
    height={400}
    quality={85}
    priority={false}
    sizes="(max-width: 768px) 100vw, 400px"
    className="w-full max-w-sm mx-auto rounded-lg"
  />
);