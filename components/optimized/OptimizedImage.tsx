'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { performanceMonitor } from '@/lib/performance/performance-monitor';
import { ImageIcon, Loader2, AlertCircle } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
  fill?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 85,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
  sizes,
  fill = false
}: OptimizedImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const imageRef = useRef<HTMLImageElement>(null);

  // Generate optimized image URL with transformations
  const optimizedSrc = useCallback(() => {
    // If using a CDN like Cloudinary or ImageKit, add transformations
    if (src.includes('cloudinary.com') || src.includes('imagekit.io')) {
      const separator = src.includes('cloudinary.com') ? '/upload/' : '/';
      const baseUrl = src.split(separator)[0] + separator;
      const filename = src.split(separator)[1];
      
      // Add quality and format optimizations
      const transforms = [
        'f_auto', // Auto format (WebP when supported)
        'q_auto', // Auto quality
        `q_${quality}`, // Custom quality
        width ? `w_${width}` : '',
        height ? `h_${height}` : '',
        'c_fill' // Crop to fill
      ].filter(Boolean).join(',');
      
      return `${baseUrl}${transforms}/${filename}`;
    }
    
    return src;
  }, [src, width, height, quality]);

  // Create a low-quality placeholder if not provided
  const generateBlurDataURL = useCallback(() => {
    if (blurDataURL) return blurDataURL;
    
    // Generate a simple gradient placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 40, 40);
      gradient.addColorStop(0, '#f3f4f6');
      gradient.addColorStop(1, '#e5e7eb');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 40, 40);
    }
    
    return canvas.toDataURL();
  }, [blurDataURL]);

  const handleLoadStart = () => {
    startTimeRef.current = performance.now();
    setLoading(true);
    setError(false);
  };

  const handleLoad = () => {
    const endTime = performance.now();
    const duration = endTime - startTimeRef.current;
    
    setLoading(false);
    setLoadTime(duration);
    
    // Track performance
    performanceMonitor.trackImageLoad(src, startTimeRef.current);
    
    onLoad?.();
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    
    // Track error
    performanceMonitor.trackApiCall('image-load-error', 'GET', 0, false);
    
    onError?.();
  };

  // Preload critical images
  useEffect(() => {
    if (priority && typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = optimizedSrc();
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, optimizedSrc]);

  // Intersection Observer for lazy loading
  const [isVisible, setIsVisible] = useState(priority);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (priority) return; // Don't lazy load priority images
    
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before visible
        threshold: 0.1
      }
    );

    const imageElement = imageRef.current;
    if (imageElement) {
      observerRef.current.observe(imageElement);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority]);

  // Error fallback component
  const ErrorFallback = () => (
    <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
      <div className="text-center text-gray-400">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">Failed to load image</p>
      </div>
    </div>
  );

  // Loading placeholder component
  const LoadingPlaceholder = () => (
    <div className={`bg-gray-100 flex items-center justify-center animate-pulse ${className}`}>
      <div className="text-center text-gray-400">
        {loading ? (
          <Loader2 className="h-8 w-8 mx-auto animate-spin" />
        ) : (
          <ImageIcon className="h-8 w-8 mx-auto" />
        )}
      </div>
    </div>
  );

  if (error) {
    return <ErrorFallback />;
  }

  return (
    <div 
      ref={imageRef}
      className={`relative overflow-hidden ${className}`}
      style={!fill ? { width, height } : undefined}
    >
      {(!isVisible || loading) && <LoadingPlaceholder />}
      
      {isVisible && (
        <Image
          src={optimizedSrc()}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          quality={quality}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={placeholder === 'blur' ? generateBlurDataURL() : undefined}
          sizes={sizes}
          className={`transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'} ${className}`}
          onLoadStart={handleLoadStart}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            objectFit: 'cover',
            objectPosition: 'center'
          }}
        />
      )}
      
      {/* Performance indicator (dev mode only) */}
      {process.env.NODE_ENV === 'development' && loadTime !== null && (
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {loadTime.toFixed(0)}ms
        </div>
      )}
    </div>
  );
}