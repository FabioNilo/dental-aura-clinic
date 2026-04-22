import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Pacientes from "@/pages/admin/Pacientes";
import { TestMemoryRouter } from "@/test/router";

const createPacienteMock = vi.fn();
const updatePacienteMock = vi.fn();
const refetchMock = vi.fn();

const pacienteMock = {
  ativo: true,
  cpf: "11122233344",
  created_at: "2026-04-03T12:00:00.000Z",
  data_nascimento: "1989-03-12",
  email: "maria@clinica.com",
  endereco: "Rua A, 10",
  id: "pac-1",
  nome: "Maria Souza",
  observacoes: "Paciente recorrente",
  telefone: "(11) 99999-8888",
  updated_at: "2026-04-03T12:00:00.000Z",
};

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/features/pacientes/api", () => ({
  useCreatePaciente: () => ({
    isPending: false,
    mutateAsync: createPacienteMock,
  }),
  usePacienteById: () => ({
    data: pacienteMock,
    isLoading: false,
  }),
  usePacientesListQuery: () => ({
    data: {
      count: 1,
      items: [pacienteMock],
      page: 1,
      pageSize: 20,
    },
    isLoading: false,
    refetch: refetchMock,
  }),
  useUpdatePaciente: () => ({
    isPending: false,
    mutateAsync: updatePacienteMock,
  }),
}));

describe("Pacientes page", () => {
  beforeEach(() => {
    createPacienteMock.mockReset();
    updatePacienteMock.mockReset();
    refetchMock.mockReset();
    createPacienteMock.mockResolvedValue({
      ativo: true,
      cpf: "99988877766",
      created_at: "2026-04-03T12:00:00.000Z",
      data_nascimento: "1991-04-22",
      email: "renata@clinica.com",
      endereco: "Rua Nova, 40",
      id: "pac-2",
      nome: "Renata Campos",
      observacoes: "Primeiro contato por recepcao",
      telefone: "(11) 90000-1212",
      updated_at: "2026-04-03T12:00:00.000Z",
    });
  });

  it("creates a new patient with the filled form values", async () => {
    render(
      <TestMemoryRouter>
        <Pacientes />
      </TestMemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /novo paciente/i }));
    fireEvent.change(screen.getByLabelText(/nome do paciente/i), {
      target: { value: "Renata Campos" },
    });
    fireEvent.change(screen.getByLabelText(/^telefone$/i), {
      target: { value: "(11) 90000-1212" },
    });
    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: "renata@clinica.com" },
    });
    fireEvent.change(screen.getByLabelText(/^cpf$/i), {
      target: { value: "99988877766" },
    });
    fireEvent.change(screen.getByLabelText(/data de nascimento/i), {
      target: { value: "1991-04-22" },
    });
    fireEvent.change(screen.getByLabelText(/endereco/i), {
      target: { value: "Rua Nova, 40" },
    });
    fireEvent.change(screen.getByLabelText(/observacoes/i), {
      target: { value: "Primeiro contato por recepcao" },
    });
    fireEvent.click(screen.getByRole("button", { name: /criar paciente/i }));

    await waitFor(() => {
      expect(createPacienteMock).toHaveBeenCalledWith({
        ativo: true,
        cpf: "99988877766",
        data_nascimento: "1991-04-22",
        email: "renata@clinica.com",
        endereco: "Rua Nova, 40",
        id: undefined,
        nome: "Renata Campos",
        observacoes: "Primeiro contato por recepcao",
        telefone: "(11) 90000-1212",
      });
    });
  });
});
