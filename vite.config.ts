// Generated a standard Vite config for a React+TS project.
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve("./src"),
      },
    },
    define: {
      // The previous configuration attempted to define individual properties on `process.env`,
      // which can be unreliable. This new configuration defines the entire `process.env` object.
      // Vite will replace any occurrence of `process.env` with this object, ensuring that
      // `process.env.API_KEY` is correctly resolved in the browser, fixing the "API Key must be set" error.
      'process.env': {
        VITE_SUPABASE_URL: JSON.stringify(env.VITE_SUPABASE_URL),
        VITE_SUPABASE_ANON_KEY: JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
        API_KEY: JSON.stringify(env.API_KEY),
        VITE_N8N_URL: JSON.stringify(env.VITE_N8N_URL),
        VITE_N8N_API_KEY: JSON.stringify(env.VITE_N8N_API_KEY),
      }
    }
  }
})