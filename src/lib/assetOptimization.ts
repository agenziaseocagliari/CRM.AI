// Asset Optimization utilities for Guardian AI CRM
// Handles image compression, progressive loading, and asset management

import React, { useCallback, useEffect, useState } from 'react';

// Image compression utility
export const compressImage = (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get 2D context'));
      return;
    }
    const img = new Image();

    img.onload = () => {
      // Calculate optimal dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Apply compression
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to compress image'));
        }
      }, 'image/jpeg', quality);
    };

    img.src = URL.createObjectURL(file);
  });
};

// Progressive image loading hook
export const useProgressiveImage = (src: string) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const img = new Image();
    
    img.onload = () => {
      setImageLoaded(true);
      setImageError(false);
    };
    
    img.onerror = () => {
      setImageError(true);
      setImageLoaded(false);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { imageLoaded, imageError };
};

// Lazy image component with progressive loading
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+',
  onLoad,
  onError
}) => {
  const { imageLoaded, imageError } = useProgressiveImage(src);
  const [isInView, setIsInView] = useState(false);

  const imgRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(node);
    }
  }, []);

  if (!isInView) {
    return (
      <div
        ref={imgRef}
        className={`bg-gray-200 animate-pulse ${className}`}
        style={{ minHeight: '200px' }}
      >
        <img
          src={placeholder}
          alt="Loading..."
          className={`w-full h-full object-cover opacity-50 ${className}`}
        />
      </div>
    );
  }

  if (imageError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <img
      src={imageLoaded ? src : placeholder}
      alt={alt}
      className={`transition-opacity duration-300 ${
        imageLoaded ? 'opacity-100' : 'opacity-50'
      } ${className}`}
      onLoad={onLoad}
      onError={onError}
    />
  );
};

// Asset preloader for critical resources
export const preloadAssets = (assets: string[]) => {
  return Promise.all(
    assets.map(
      (asset) =>
        new Promise((resolve, reject) => {
          const link = document.createElement('link');
          link.rel = 'preload';
          
          if (asset.match(/\.(jpg|jpeg|png|webp|svg)$/i)) {
            link.as = 'image';
          } else if (asset.match(/\.(woff|woff2|ttf|otf)$/i)) {
            link.as = 'font';
            link.crossOrigin = 'anonymous';
          } else if (asset.match(/\.css$/i)) {
            link.as = 'style';
          } else {
            link.as = 'script';
          }
          
          link.href = asset;
          link.onload = () => resolve(asset);
          link.onerror = () => reject(asset);
          
          document.head.appendChild(link);
        })
    )
  );
};

// WebP support detection
export const supportsWebP = (): boolean => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
};

// Optimal image format selector
export const getOptimalImageSrc = (baseSrc: string): string => {
  if (supportsWebP()) {
    return baseSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }
  return baseSrc;
};

// Resource size analyzer
export const analyzeAssetSize = async (url: string): Promise<number> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    return contentLength ? parseInt(contentLength, 10) : 0;
  } catch {
    return 0;
  }
};