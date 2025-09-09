// Generated a standard Vite config for a React+TS project.
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Expose Supabase env vars to the client
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      // IMPORTANT: API_KEY is sensitive and should not be exposed to the client directly in a production app.
      // It's included here for development convenience. For production, use serverless functions.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Expose N8N env vars for automation integration
      'process.env.VITE_N8N_URL': JSON.stringify(env.VITE_N8N_URL),
      'process.env.VITE_N8N_API_KEY': JSON.stringify(env.VITE_N8N_API_KEY),
    }
  }
})