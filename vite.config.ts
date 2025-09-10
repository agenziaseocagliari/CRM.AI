// Generated a standard Vite config for a React+TS project.
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
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
      // This configuration defines the entire `process.env` object, providing fallbacks
      // to empty strings. This prevents a fatal error during initialization if an env var
      // is missing in the build environment (like Vercel), ensuring that runtime checks
      // can properly handle the missing variable instead of crashing with a white screen.
      'process.env': {
        VITE_SUPABASE_URL: JSON.stringify(env.VITE_SUPABASE_URL || ''),
        VITE_SUPABASE_ANON_KEY: JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
        API_KEY: JSON.stringify(env.API_KEY || ''),
        VITE_N8N_URL: JSON.stringify(env.VITE_N8N_URL || ''),
        VITE_N8N_API_KEY: JSON.stringify(env.VITE_N8N_API_KEY || ''),
      }
    }
  }
})