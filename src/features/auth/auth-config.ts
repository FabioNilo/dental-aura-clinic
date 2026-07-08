export type AuthProviderMode = "supabase" | "n8n" | "hybrid";

function normalizeAuthProvider(value: string | undefined | null): AuthProviderMode {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "n8n" || normalized === "hybrid") {
    return normalized;
  }

  return "supabase";
}

export function getAuthProviderMode(): AuthProviderMode {
  return normalizeAuthProvider(import.meta.env.VITE_AUTH_PROVIDER);
}

export function getN8nAuthUrl() {
  const value = import.meta.env.VITE_N8N_AUTH_URL?.trim();

  if (!value) {
    return "";
  }

  return value.replace(/\/$/, "");
}

export function hasN8nAuthBridge() {
  return Boolean(getN8nAuthUrl());
}
