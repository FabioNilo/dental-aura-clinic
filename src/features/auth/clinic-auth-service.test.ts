import { beforeEach, describe, expect, it, vi } from "vitest";
import { signInClinicAdmin } from "@/features/auth/clinic-auth-service";

const storage = (() => {
  const store = new Map<string, string>();

  return {
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
})();

vi.stubGlobal("localStorage", storage);
Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: storage,
});

describe("clinic-auth-service", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubGlobal("fetch", vi.fn());
    storage.clear();
  });

  it("authenticates with n8n and returns the clinic admin session", async () => {
    vi.stubEnv("VITE_DENTAL_AURA_API_BASE_URL", "https://n8n.example/webhook");

    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            clinic: {
              id: "clinic-1",
              name: "Clinica Teste",
              slug: "clinica-teste",
            },
            token: "token",
            user: {
              clinic_id: "clinic-1",
              clinic_name: "Clinica Teste",
              clinic_slug: "clinica-teste",
              email: "admin@clinica.com",
              id: "user-1",
              role: "clinic_admin",
            },
          },
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          status: 200,
        },
      ),
    );

    const result = await signInClinicAdmin("admin@clinica.com", "123456");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://n8n.example/webhook/dental-aura/clinic/auth/login",
      expect.objectContaining({
        body: JSON.stringify({
          app: "dental-aura-clinic",
          email: "admin@clinica.com",
          password: "123456",
          source: "clinic_login",
        }),
        method: "POST",
      }),
    );
    expect(result.source).toBe("n8n");
    expect(result.isAdmin).toBe(true);
    expect(result.clinic.id).toBe("clinic-1");
    expect(result.user.email).toBe("admin@clinica.com");
  });

  it("throws when the n8n base URL is missing", async () => {
    await expect(signInClinicAdmin("admin@clinica.com", "123456")).rejects.toThrow(
      "API n8n nao configurada.",
    );
  });
});
