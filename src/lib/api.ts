function getRawBaseUrl() {
  return (
    (import.meta.env.VITE_DENTAL_AURA_API_BASE_URL as string | undefined) ??
    (import.meta.env.VITE_DENTAL_AURA_WEBHOOK_BASE_URL as string | undefined) ??
    (import.meta.env.VITE_N8N_API_BASE_URL as string | undefined) ??
    (import.meta.env.VITE_N8N_BASE_URL as string | undefined)
  );
}

export const N8N_BASE_URL = getRawBaseUrl()?.replace(/\/$/, "") ?? "";

export function getN8NBaseUrl() {
  return getRawBaseUrl()?.replace(/\/$/, "") ?? "";
}

const CLINIC_TOKEN_STORAGE_KEY = "dental-aura:clinic-token";
const PLATFORM_TOKEN_STORAGE_KEY = "dental-aura:platform-token";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function hasN8NBaseUrl() {
  return getN8NBaseUrl().length > 0;
}

export function buildN8nUrl(path: string) {
  if (!hasN8NBaseUrl()) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const baseUrl = getN8NBaseUrl();

  if (baseUrl.endsWith("/webhook") && normalizedPath.startsWith("/webhook/")) {
    return `${baseUrl}${normalizedPath.replace(/^\/webhook/, "")}`;
  }

  return `${baseUrl}${normalizedPath}`;
}

function isHtmlResponse(response: Response, rawBody: string) {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const trimmedBody = rawBody.trim().toLowerCase();

  return (
    contentType.includes("text/html") ||
    trimmedBody.startsWith("<!doctype html") ||
    trimmedBody.startsWith("<html")
  );
}

function getUnexpectedHtmlMessage(response: Response, path: string) {
  const url = response.url || buildN8nUrl(path);

  return (
    `A API retornou HTML em ${url}. ` +
    "Verifique VITE_DENTAL_AURA_API_BASE_URL: em producao use a URL absoluta do n8n com /webhook; " +
    "/webhook relativo so funciona no dev server com proxy."
  );
}

export const setClinicAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(CLINIC_TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(CLINIC_TOKEN_STORAGE_KEY);
  }
};

export const getClinicAuthToken = () => localStorage.getItem(CLINIC_TOKEN_STORAGE_KEY);

export const setPlatformAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(PLATFORM_TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(PLATFORM_TOKEN_STORAGE_KEY);
  }
};

export const getPlatformAuthToken = () => localStorage.getItem(PLATFORM_TOKEN_STORAGE_KEY);

type RequestOptions = {
  allowEmptyBody?: boolean;
  auth?: "clinic" | "platform" | false;
};

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {},
): Promise<T> {
  if (!hasN8NBaseUrl()) {
    throw new ApiError(
      "API n8n nao configurada. Defina VITE_DENTAL_AURA_API_BASE_URL no .env e reinicie o app.",
      0,
    );
  }

  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  const headers = new Headers(init.headers ?? undefined);

  if (!isFormData) {
    headers.set("content-type", "application/json");
  }

  const authMode = options.auth ?? "clinic";
  const token =
    authMode === "platform"
      ? getPlatformAuthToken()
      : authMode === "clinic"
        ? getClinicAuthToken()
        : null;

  if (token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildN8nUrl(path), {
    ...init,
    headers,
  });
  const rawBody = await response.text();

  if (!response.ok) {
    if (isHtmlResponse(response, rawBody)) {
      throw new ApiError(getUnexpectedHtmlMessage(response, path), response.status);
    }

    let message = rawBody;

    try {
      const parsed = JSON.parse(rawBody) as { error?: string; message?: string };
      message = parsed.error ?? parsed.message ?? rawBody;
    } catch {
      message = rawBody;
    }

    throw new ApiError(
      message || `Falha na API (${response.status}) em ${response.url || buildN8nUrl(path)}.`,
      response.status,
    );
  }

  if (!rawBody.trim()) {
    if (options.allowEmptyBody) {
      return {} as T;
    }

    throw new ApiError(
      `A API respondeu sem JSON (${response.status}) em ${response.url || buildN8nUrl(path)}.`,
      response.status,
    );
  }

  if (isHtmlResponse(response, rawBody)) {
    throw new ApiError(getUnexpectedHtmlMessage(response, path), response.status);
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    throw new ApiError(
      `A API respondeu em formato invalido em ${response.url || buildN8nUrl(path)}: ${rawBody.slice(0, 200)}.`,
      response.status,
    );
  }
}
