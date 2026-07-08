import { Route, Routes } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClinicAuthProvider, RequireAdmin } from "@/features/auth/ClinicAuth";
import { TestMemoryRouter } from "@/test/router";

const {
  clinicAfterActiveMock,
  clinicAwaitableMock,
  clinicFromMock,
  clinicRoleQueryMock,
  clinicSchemaMock,
  getSessionMock,
  limitMock,
  onAuthStateChangeMock,
  roleEqMock,
  selectMock,
  userEqMock,
  publicFromMock,
} = vi.hoisted(() => {
  const clinicAfterActiveMock = { eq: vi.fn() };
  const clinicAwaitableMock = { eq: vi.fn(), then: vi.fn() };
  const clinicRoleQueryMock = { eq: vi.fn(), limit: vi.fn() };

  return {
    clinicAfterActiveMock,
    clinicAwaitableMock,
    clinicFromMock: vi.fn(),
    clinicRoleQueryMock,
    clinicSchemaMock: vi.fn(),
    getSessionMock: vi.fn(),
    limitMock: vi.fn(),
    onAuthStateChangeMock: vi.fn(),
    publicFromMock: vi.fn(),
    roleEqMock: vi.fn(),
    selectMock: vi.fn(),
    userEqMock: vi.fn(),
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeMock,
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: publicFromMock,
    schema: clinicSchemaMock,
  },
}));

describe("Clinic auth routing", () => {
  beforeEach(() => {
    publicFromMock.mockReset();
    clinicSchemaMock.mockReset();
    clinicFromMock.mockReset();
    getSessionMock.mockReset();
    onAuthStateChangeMock.mockReset();
    limitMock.mockReset();
    roleEqMock.mockReset();
    selectMock.mockReset();
    userEqMock.mockReset();
    clinicAfterActiveMock.eq.mockReset();
    clinicAwaitableMock.eq.mockReset();
    clinicAwaitableMock.then.mockReset();
    clinicRoleQueryMock.eq.mockReset();
    clinicRoleQueryMock.limit.mockReset();

    onAuthStateChangeMock.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });

    publicFromMock.mockReturnValue({
      select: selectMock,
    });
    selectMock.mockReturnValue({
      eq: userEqMock,
    });
    userEqMock.mockReturnValue({
      eq: roleEqMock,
    });
    roleEqMock.mockReturnValue({
      limit: limitMock,
    });
    limitMock.mockResolvedValue({
      data: [],
      error: null,
    });

    clinicSchemaMock.mockReturnValue({
      from: clinicFromMock,
    });
    clinicFromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(clinicAfterActiveMock),
      }),
    });
    clinicAfterActiveMock.eq.mockReturnValue(clinicRoleQueryMock);
    clinicRoleQueryMock.eq.mockReturnValue(clinicRoleQueryMock);
    clinicRoleQueryMock.limit.mockReturnValue(clinicAwaitableMock);
    clinicAwaitableMock.eq.mockReturnValue(clinicAwaitableMock);
    clinicAwaitableMock.then.mockImplementation((resolve) =>
      resolve({
        data: [],
        error: null,
      }),
    );
  });

  it("redirects unauthenticated users to /admin/login", async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: null,
      },
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

  it("treats role lookup failures as non-admin access", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

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
    limitMock.mockResolvedValue({
      data: null,
      error: { message: "RLS denied" },
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

    errorSpy.mockRestore();
  });
});
