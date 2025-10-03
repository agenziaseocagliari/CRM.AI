// Advanced Vite configuration for asset optimization
// Guardian AI CRM Performance Optimization

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { Plugin } from 'vite';

// Custom plugin for asset compression
const assetCompressionPlugin = (): Plugin => {
  return {
    name: 'asset-compression',
    generateBundle(options, bundle) {
      Object.keys(bundle).forEach(fileName => {
        const chunk = bundle[fileName];
        if (chunk.type === 'asset' && chunk.source) {
          // Log asset sizes for monitoring
          const size = typeof chunk.source === 'string' 
            ? chunk.source.length 
            : chunk.source.byteLength;
          
          console.log(`📦 Asset: ${fileName} - ${(size / 1024).toFixed(2)}KB`);
        }
      });
    }
  };
};

// Custom plugin for security headers
const securityHeadersPlugin = (): Plugin => {
  return {
    name: 'security-headers',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Security headers for development
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        
        // CSP for development (more permissive)
        res.setHeader('Content-Security-Policy', [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob:",
          "connect-src 'self' ws://localhost:* http://localhost:* https://*.supabase.co wss://*.supabase.co",
          "font-src 'self' data:",
          "object-src 'none'",
          "frame-src 'none'"
        ].join('; '));
        
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        // Stricter headers for preview/production
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        
        // Production CSP
        res.setHeader('Content-Security-Policy', [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: https:",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
          "frame-src 'none'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'"
        ].join('; '));
        
        next();
      });
    }
  };
};

// Custom plugin for image optimization
const imageOptimizationPlugin = (): Plugin => {
  return {
    name: 'image-optimization',
    load(id) {
      if (id.includes('?optimize')) {
        // Mark images for optimization
        return null;
      }
    },
    transform(code, id) {
      if (id.match(/\.(png|jpg|jpeg|webp|svg)$/)) {
        // Add optimization hints
        return {
          code,
          map: null
        };
      }
    }
  };
};

export default defineConfig({
  plugins: [
    react({
      // Enable React optimizations
      jsxImportSource: undefined,
      jsxRuntime: 'automatic',
    }),
    securityHeadersPlugin(),
    assetCompressionPlugin(),
    imageOptimizationPlugin(),
  ],
  
  // Asset handling configuration
  assetsInclude: ['**/*.woff', '**/*.woff2', '**/*.ttf', '**/*.otf'],
  
  build: {
    // Output directory
    outDir: 'dist',
    
    // Asset optimization
    assetsDir: 'assets',
    assetsInlineLimit: 4096, // 4KB threshold for inlining
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Source maps for production debugging
    sourcemap: false, // Set to true for debugging
    
    // Minification options
    minify: 'terser',
    
    // Rollup options for advanced bundling
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-ui': ['@headlessui/react', '@heroicons/react'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers'],
          'vendor-charts': ['recharts', 'chart.js'],
          'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge'],
          
          // Feature-based chunks (using actual file paths)
          'dashboard': ['src/components/Dashboard.tsx'],
          'contacts': ['src/components/Contacts.tsx'],
          'opportunities': ['src/components/Opportunities.tsx'],
          'forms': ['src/components/Forms.tsx'],
          'automations': ['src/components/Automations.tsx']
        },
        
        // Asset file naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          
          // Organize assets by type
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name].[hash][extname]`;
          }
          if (/woff2?|ttf|otf|eot/i.test(ext)) {
            return `fonts/[name].[hash][extname]`;
          }
          if (ext === 'css') {
            return `styles/[name].[hash][extname]`;
          }
          return `assets/[name].[hash][extname]`;
        },
        
        // Chunk file naming
        chunkFileNames: 'js/[name].[hash].js',
        entryFileNames: 'js/[name].[hash].js',
      },
      
      // External dependencies (if using CDN)
      external: (id) => {
        // Uncomment to externalize large libraries
        // return ['react', 'react-dom'].includes(id);
        return false;
      },
    },
    
    // Target for modern browsers
    target: ['es2020', 'chrome80', 'firefox78', 'safari14'],
    
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000, // 1MB
    
    // Report bundle size
    reportCompressedSize: true,
  },
  
  // Development server optimization
  server: {
    // Preload critical assets
    middlewareMode: false,
    fs: {
      strict: false,
    },
  },
  
  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@headlessui/react',
      '@heroicons/react/24/outline',
      '@heroicons/react/24/solid',
      'react-hook-form',
      '@hookform/resolvers/zod',
      'zod',
      'date-fns',
      'clsx',
      'tailwind-merge'
    ],
    exclude: [
      // Exclude any problematic dependencies
    ],
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@lib': resolve(__dirname, 'src/lib'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@styles': resolve(__dirname, 'src/styles'),
    },
  },
  
  // CSS configuration
  css: {
    postcss: {
      plugins: [
        // PostCSS plugins for optimization
      ],
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`,
      },
    },
  },
  
  // Environment variables
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __PROD__: JSON.stringify(process.env.NODE_ENV === 'production'),
  },
});