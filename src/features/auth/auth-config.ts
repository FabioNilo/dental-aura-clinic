export type AuthProviderMode = "n8n";

function normalizeAuthProvider(_value: string | undefined | null): AuthProviderMode {
  return "n8n";
}

export function getAuthProviderMode(): AuthProviderMode {
  return normalizeAuthProvider(import.meta.env.VITE_AUTH_PROVIDER);
}

export function getN8nAuthUrl() {
  const baseUrl =
    import.meta.env.VITE_DENTAL_AURA_API_BASE_URL?.trim() ??
    import.meta.env.VITE_DENTAL_AURA_WEBHOOK_BASE_URL?.trim() ??
    import.meta.env.VITE_N8N_API_BASE_URL?.trim() ??
    import.meta.env.VITE_N8N_BASE_URL?.trim();
  const value = baseUrl ? `${baseUrl.replace(/\/$/, "")}/dental-aura/clinic/auth/login` : "";

  if (!value) {
    return "";
  }

  return value;
}

export function hasN8nAuthBridge() {
  return Boolean(getN8nAuthUrl());
}
