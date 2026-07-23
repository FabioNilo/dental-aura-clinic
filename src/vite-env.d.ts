/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_PROVIDER?: "n8n";
  readonly VITE_DENTAL_AURA_API_BASE_URL?: string;
  readonly VITE_DENTAL_AURA_WEBHOOK_BASE_URL?: string;
  readonly VITE_N8N_API_BASE_URL?: string;
  readonly VITE_N8N_BASE_URL?: string;
  readonly VITE_N8N_CLINICAL_URL?: string;
}
