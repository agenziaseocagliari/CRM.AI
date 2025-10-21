import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['jspdf', 'html2canvas', 'jspdf-autotable', 'dompurify'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key'
    }
  },
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'js',
    sourcemap: true, // 🔧 ENABLE SOURCE MAPS FOR DEBUGGING (removed duplicate)
    commonjsOptions: {
      include: [/jspdf/, /html2canvas/, /dompurify/, /node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: ['canvg'],
      output: {
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType || '')) {
            return `images/[name].[hash][extname]`;
          }
          if (/css/i.test(extType || '')) {
            return `styles/[name].[hash][extname]`;
          }
          return `js/[name].[hash][extname]`;
        },
        chunkFileNames: 'js/[name].[hash].js',
        entryFileNames: 'js/[name].[hash].js',
      }
    },
    cssCodeSplit: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // 🔧 Keep console.log for debugging
        drop_debugger: false, // 🔧 Keep debugger for debugging
      },
    },
  },
  css: {
    postcss: './postcss.config.cjs',
  },
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
});