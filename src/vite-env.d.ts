/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_PROVIDER?: "supabase" | "n8n" | "hybrid";
  readonly VITE_N8N_AUTH_URL?: string;
}
