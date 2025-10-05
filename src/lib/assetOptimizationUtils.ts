// Asset Optimization utilities for Guardian AI CRM
// Pure functions for image compression and asset management

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

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Asset preloading utility
export const preloadAssets = (assets: string[]) => {
  const promises = assets.map(asset => {
    return new Promise<void>((resolve, reject) => {
      if (asset.match(/\.(png|jpe?g|gif|svg)$/i)) {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load ${asset}`));
        img.src = asset;
      } else if (asset.match(/\.(css)$/i)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to load ${asset}`));
        link.href = asset;
        document.head.appendChild(link);
      } else {
        // For other assets, just resolve
        resolve();
      }
    });
  });

  return Promise.allSettled(promises);
};

// WebP support detection
export const supportsWebP = (): boolean => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
};

// Get optimal image source based on browser support
export const getOptimalImageSrc = (baseSrc: string): string => {
  if (supportsWebP() && !baseSrc.includes('.webp')) {
    return baseSrc.replace(/\.(png|jpe?g)$/i, '.webp');
  }
  return baseSrc;
};

// Analyze asset size
export const analyzeAssetSize = async (url: string): Promise<number> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentLength = response.headers.get('Content-Length');
    return contentLength ? parseInt(contentLength, 10) : 0;
  } catch (error) {
    console.warn(`Failed to analyze asset size for ${url}:`, error);
    return 0;
  }
};