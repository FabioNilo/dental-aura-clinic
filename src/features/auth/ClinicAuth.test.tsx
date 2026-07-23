import { Route, Routes } from "react-router-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClinicAuthProvider, RequireAdmin, useClinicAuth } from "@/features/auth/ClinicAuth";
import { TestMemoryRouter } from "@/test/router";

const fetchMock = vi.fn();
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

vi.stubGlobal("fetch", fetchMock);
vi.stubGlobal("localStorage", storage);
Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: storage,
});

describe("Clinic auth routing", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    storage.clear();
    vi.unstubAllEnvs();
  });

  it("redirects unauthenticated users to /admin/login", async () => {
    render(
      <TestMemoryRouter initialEntries={["/admin/solicitacoes"]}>
        <ClinicAuthProvider>
          <Routes>
            <Route path="/admin/login" element={<div>PAGINA LOGIN</div>} />
            <Route
              path="/admin/solicitacoes"
              element={
                <RequireAdmin>
                  <div>AREA ADMIN</div>
                </RequireAdmin>
              }
            />
          </Routes>
        </ClinicAuthProvider>
      </TestMemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("PAGINA LOGIN")).toBeInTheDocument();
    });
  });

  it("allows stored admin sessions to access protected routes", async () => {
    window.localStorage.setItem(
      "dental-aura:clinic-session",
      JSON.stringify({
        clinic: {
          id: "clinic-1",
          name: "Clinica Teste",
          slug: "clinica-teste",
        },
        isAdmin: true,
        token: "token",
        user: {
          clinic_id: "clinic-1",
          clinic_name: "Clinica Teste",
          clinic_slug: "clinica-teste",
          email: "admin@clinica.com",
          id: "user-1",
          role: "clinic_admin",
        },
      }),
    );

    render(
      <TestMemoryRouter initialEntries={["/admin/solicitacoes"]}>
        <ClinicAuthProvider>
          <Routes>
            <Route path="/admin/login" element={<div>PAGINA LOGIN</div>} />
            <Route
              path="/admin/solicitacoes"
              element={
                <RequireAdmin>
                  <div>AREA ADMIN</div>
                </RequireAdmin>
              }
            />
          </Routes>
        </ClinicAuthProvider>
      </TestMemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("AREA ADMIN")).toBeInTheDocument();
    });
  });

  it("signs in via n8n and stores the session locally", async () => {
    vi.stubEnv("VITE_DENTAL_AURA_API_BASE_URL", "https://n8n.example/webhook");

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

    render(
      <TestMemoryRouter initialEntries={["/admin/login"]}>
        <ClinicAuthProvider>
          <Routes>
            <Route path="/admin/login" element={<LoginProbe />} />
          </Routes>
        </ClinicAuthProvider>
      </TestMemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "admin" })).toBeInTheDocument();
    });

    expect(window.localStorage.getItem("dental-aura:clinic-session")).toContain(
      "admin@clinica.com",
    );
  });
});

function LoginProbe() {
  const { isAdmin, signIn } = useClinicAuth();

  return (
    <button type="button" onClick={() => void signIn("admin@clinica.com", "123456")}>
      {isAdmin ? "admin" : "login"}
    </button>
  );
}
