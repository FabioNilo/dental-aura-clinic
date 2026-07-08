import { Route, Routes } from "react-router-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminLogin from "@/pages/admin/AdminLogin";
import { TestMemoryRouter } from "@/test/router";

const signInMock = vi.fn();

vi.mock("@/features/auth/ClinicAuth", () => ({
  useClinicAuth: () => ({
    isAdmin: false,
    isLoading: false,
    session: null,
    signIn: signInMock,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

describe("AdminLogin", () => {
  beforeEach(() => {
    signInMock.mockReset();
    signInMock.mockResolvedValue(undefined);
  });

  it("submits email and password then navigates to the admin route", async () => {
    render(
      <TestMemoryRouter
        initialEntries={[
          {
            pathname: "/admin/login",
            state: { from: "/admin/solicitacoes" },
          },
        ]}
      >
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/solicitacoes" element={<div>Fila aberta</div>} />
        </Routes>
      </TestMemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@clinica.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Acessar painel" }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith("admin@clinica.com", "123456");
    });

    await waitFor(() => {
      expect(screen.getByText("Fila aberta")).toBeInTheDocument();
    });
  });

  it("shows the backend error when the login fails", async () => {
    signInMock.mockRejectedValueOnce(new Error("Credenciais invalidas"));

    render(
      <TestMemoryRouter initialEntries={["/admin/login"]}>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
        </Routes>
      </TestMemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Acessar painel" }));

    await waitFor(() => {
      expect(screen.getByText("Credenciais invalidas")).toBeInTheDocument();
    });
  });
});
