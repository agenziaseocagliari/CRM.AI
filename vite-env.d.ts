/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Vite built-in environment variables
  readonly MODE: string
  readonly PROD: boolean
  readonly DEV: boolean
  readonly BASE_URL: string

  // Supabase configuration
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY: string

  // API Keys
  readonly VITE_RESEND_API_KEY: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_N8N_API_KEY: string
  readonly VITE_DATAPIZZA_API_URL: string

  // URLs
  readonly VITE_N8N_URL: string

  // App configuration
  readonly VITE_APP_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}