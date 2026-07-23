import { getAuthProviderMode } from "@/features/auth/auth-config";

type ClinicalBridgeResponseShape = {
  data?: unknown;
  message?: string;
  ok?: boolean;
  prontuario?: unknown;
  result?: unknown;
  tratamento?: unknown;
};

function parseResponsePayload(response: Response) {
  return response
    .text()
    .then((text) => {
      if (!text) {
        return null;
      }

      try {
        return JSON.parse(text) as ClinicalBridgeResponseShape;
      } catch {
        return { message: text } as ClinicalBridgeResponseShape;
      }
    })
    .catch(() => null);
}

export function getN8nClinicalUrl() {
  const value = import.meta.env.VITE_N8N_CLINICAL_URL?.trim();

  if (!value) {
    return "";
  }

  return value.replace(/\/$/, "");
}

export function hasN8nClinicalBridge() {
  return Boolean(getN8nClinicalUrl());
}

export function shouldTryN8nClinicalBridge() {
  const providerMode = getAuthProviderMode();
  return (providerMode === "n8n" || providerMode === "hybrid") && hasN8nClinicalBridge();
}

export function extractClinicalRecord(payload: ClinicalBridgeResponseShape | null | undefined) {
  const candidate = payload?.data ?? payload?.prontuario ?? payload?.tratamento ?? payload?.result ?? null;

  if (Array.isArray(candidate)) {
    return candidate[0] ?? null;
  }

  return candidate;
}

export async function sendClinicalMutationToN8n(operation: string, payload: Record<string, unknown>) {
  if (!hasN8nClinicalBridge()) {
    throw new Error("Fluxo clinico via n8n nao configurado.");
  }

  const response = await fetch(getN8nClinicalUrl(), {
    body: JSON.stringify({
      ...payload,
      app: "dental-aura-clinic",
      operation,
      source: "prontuarios",
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const parsed = await parseResponsePayload(response);

  if (!response.ok) {
    throw new Error(
      parsed?.message ||
        "O endpoint clinico via n8n recusou a operacao solicitada.",
    );
  }

  if (parsed?.ok === false) {
    throw new Error(
      parsed?.message ||
        "O endpoint clinico via n8n respondeu com falha para a operacao solicitada.",
    );
  }

  return parsed;
}

