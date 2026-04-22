import { Route, Routes } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ClinicAuthProvider, RequireAdmin } from "@/features/auth/ClinicAuth";
import { TestMemoryRouter } from "@/test/router";

const {
  fromMock,
  getSessionMock,
  limitMock,
  roleEqMock,
  selectMock,
  userEqMock,
  onAuthStateChangeMock,
} = vi.hoisted(() => ({
  fromMock: vi.fn(),
  getSessionMock: vi.fn(),
  limitMock: vi.fn(),
  onAuthStateChangeMock: vi.fn(),
  roleEqMock: vi.fn(),
  selectMock: vi.fn(),
  userEqMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeMock,
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: fromMock,
  },
}));

describe("Clinic auth routing", () => {
  beforeEach(() => {
    fromMock.mockReset();
    getSessionMock.mockReset();
    onAuthStateChangeMock.mockReset();
    limitMock.mockReset();
    roleEqMock.mockReset();
    selectMock.mockReset();
    userEqMock.mockReset();

    onAuthStateChangeMock.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });

    fromMock.mockReturnValue({
      select: selectMock,
    });
    selectMock.mockReturnValue({
      eq: userEqMock,
    });
    userEqMock.mockReturnValue({
      eq: roleEqMock,
    });
  });

  it("redirects unauthenticated users to /admin/login", async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: null,
      },
    });
    roleEqMock.mockReturnValue({
      limit: limitMock,
    });
    limitMock.mockResolvedValue({
      data: [],
      error: null,
    });

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

  it("allows admin sessions to access protected routes", async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
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
        },
      },
    });
    roleEqMock.mockReturnValue({
      limit: limitMock,
    });
    limitMock.mockResolvedValue({
      data: [{ id: "role-1" }],
      error: null,
    });

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
});
