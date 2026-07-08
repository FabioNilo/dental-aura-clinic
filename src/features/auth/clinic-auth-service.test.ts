import { beforeEach, describe, expect, it, vi } from "vitest";
import { signInClinicAdmin } from "@/features/auth/clinic-auth-service";

const { setSessionMock, signInWithPasswordMock } = vi.hoisted(() => ({
  setSessionMock: vi.fn(),
  signInWithPasswordMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      setSession: setSessionMock,
      signInWithPassword: signInWithPasswordMock,
    },
  },
}));

describe("clinic-auth-service", () => {
  beforeEach(() => {
    signInWithPasswordMock.mockReset();
    setSessionMock.mockReset();
    vi.unstubAllEnvs();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("authenticates with n8n when the provider is configured", async () => {
    vi.stubEnv("VITE_AUTH_PROVIDER", "n8n");
    vi.stubEnv("VITE_N8N_AUTH_URL", "https://n8n.example/webhook/admin-login");

    const session = {
      access_token: "token",
      expires_at: 999999,
      expires_in: 3600,
      refresh_token: "refresh",
      token_type: "bearer",
      user: {
        app_metadata: {},
        aud: "authenticated",
        created_at: "2026-04-03T12:00:00.000Z",
        email: "admin@clinica.com",
        id: "user-1",
        role: "authenticated",
        user_metadata: {},
      },
    };

    setSessionMock.mockResolvedValue({
      data: {
        session,
        user: session.user,
      },
      error: null,
    });

    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          session: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
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
      "https://n8n.example/webhook/admin-login",
      expect.objectContaining({
        body: JSON.stringify({
          app: "dental-aura-clinic",
          email: "admin@clinica.com",
          password: "123456",
          source: "admin_login",
        }),
        method: "POST",
      }),
    );
    expect(setSessionMock).toHaveBeenCalledWith({
      access_token: "token",
      refresh_token: "refresh",
    });
    expect(result.source).toBe("n8n");
    expect(result.user.email).toBe("admin@clinica.com");
  });

  it("falls back to Supabase when n8n is unavailable in hybrid mode", async () => {
    vi.stubEnv("VITE_AUTH_PROVIDER", "hybrid");
    vi.stubEnv("VITE_N8N_AUTH_URL", "https://n8n.example/webhook/admin-login");

    const session = {
      access_token: "token",
      expires_at: 999999,
      expires_in: 3600,
      refresh_token: "refresh",
      token_type: "bearer",
      user: {
        app_metadata: {},
        aud: "authenticated",
        created_at: "2026-04-03T12:00:00.000Z",
        email: "admin@clinica.com",
        id: "user-1",
        role: "authenticated",
        user_metadata: {},
      },
    };

    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(
      new Response("Gateway timeout", {
        status: 504,
        statusText: "Gateway Timeout",
      }),
    );

    signInWithPasswordMock.mockResolvedValue({
      data: {
        session,
        user: session.user,
      },
      error: null,
    });

    const result = await signInClinicAdmin("admin@clinica.com", "123456");

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "admin@clinica.com",
      password: "123456",
    });
    expect(result.source).toBe("supabase");
    expect(result.user.id).toBe("user-1");
  });
});
