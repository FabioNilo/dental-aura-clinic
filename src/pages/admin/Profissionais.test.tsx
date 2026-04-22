import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Profissionais from "@/pages/admin/Profissionais";
import { TestMemoryRouter } from "@/test/router";

const createProfissionalMock = vi.fn();
const updateProfissionalMock = vi.fn();
const refetchMock = vi.fn();

const profissionalMock = {
  ativo: true,
  created_at: "2026-04-03T12:00:00.000Z",
  cro: "SP 12345",
  email: "juliana@clinica.com",
  especialidade: "Ortodontia",
  id: "prof-1",
  nome: "Dra. Juliana Sampaio",
  telefone: "(11) 99999-9999",
  updated_at: "2026-04-03T12:00:00.000Z",
};

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/features/profissionais/api", () => ({
  useCreateProfissional: () => ({
    isPending: false,
    mutateAsync: createProfissionalMock,
  }),
  useProfissionalById: () => ({
    data: profissionalMock,
    isLoading: false,
  }),
  useProfissionaisListQuery: () => ({
    data: {
      count: 1,
      items: [profissionalMock],
      page: 1,
      pageSize: 20,
    },
    isLoading: false,
    refetch: refetchMock,
  }),
  useUpdateProfissional: () => ({
    isPending: false,
    mutateAsync: updateProfissionalMock,
  }),
}));

describe("Profissionais page", () => {
  beforeEach(() => {
    createProfissionalMock.mockReset();
    updateProfissionalMock.mockReset();
    refetchMock.mockReset();
    createProfissionalMock.mockResolvedValue({
      ativo: true,
      created_at: "2026-04-03T12:00:00.000Z",
      cro: "SP 67890",
      email: "mariana@clinica.com",
      especialidade: "Implantodontia",
      id: "prof-2",
      nome: "Dra. Mariana Costa",
      telefone: "(11) 98888-7777",
      updated_at: "2026-04-03T12:00:00.000Z",
    });
  });

  it("creates a new professional with the filled form values", async () => {
    render(
      <TestMemoryRouter>
        <Profissionais />
      </TestMemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Novo profissional" }));
    fireEvent.change(screen.getByLabelText("Nome do profissional"), {
      target: { value: "Dra. Mariana Costa" },
    });
    fireEvent.change(screen.getByLabelText("Especialidade"), {
      target: { value: "Implantodontia" },
    });
    fireEvent.change(screen.getByLabelText("CRO"), {
      target: { value: "SP 67890" },
    });
    fireEvent.change(screen.getByLabelText("Telefone"), {
      target: { value: "(11) 98888-7777" },
    });
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "mariana@clinica.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar profissional" }));

    await waitFor(() => {
      expect(createProfissionalMock).toHaveBeenCalledWith({
        ativo: true,
        cro: "SP 67890",
        email: "mariana@clinica.com",
        especialidade: "Implantodontia",
        id: undefined,
        nome: "Dra. Mariana Costa",
        telefone: "(11) 98888-7777",
      });
    });
  });
});
