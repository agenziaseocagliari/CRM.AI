// FIX: Resolved the type definition error by importing `defineConfig` from 'vitest/config'
// instead of relying on a triple-slash directive. This is the recommended approach for
// extending Vite's configuration with Vitest's test options.
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// FIX: Import process to ensure correct typing for process.cwd()
import process from 'process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve("./src"),
      },
    },
    define: {
      // FIX: Replaced the full `process.env` object definition with individual
      // definitions for each variable. This is a more robust and less intrusive
      // method that avoids potential conflicts with polyfills or the build environment.
      // It ensures that missing variables are correctly replaced with an empty string,
      // allowing the application's own error handling (e.g., in supabaseClient.ts)
      // to function as intended and display a user-friendly configuration error
      // instead of causing a fatal crash.
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
    },
    test: {
      globals: true,
      environment: 'jsdom',
    },
  }
})
