import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Agenda from "@/pages/admin/Agenda";
import { TestMemoryRouter } from "@/test/router";

const updateStatusMock = vi.fn();
const refetchMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/features/agendamentos/api", () => ({
  AGENDAMENTO_STATUS_OPTIONS: ["confirmado", "remarcado", "cancelado", "concluido", "faltou"],
  useAgendamentosAdminQuery: () => ({
    data: [
      {
        created_at: "2026-04-03T12:00:00.000Z",
        data_hora: "2026-04-05T17:30:00.000Z",
        duracao_minutos: 60,
        id: "ag-1",
        observacoes: "Paciente confirmou presenca.",
        origem: "manual",
        paciente_id: "pac-1",
        paciente_nome: "Maria Souza",
        profissional_id: "prof-1",
        profissional_nome: "Dra. Ana",
        servico_id: "serv-1",
        servico_nome: "Consulta geral",
        status: "confirmado",
        updated_at: "2026-04-03T12:00:00.000Z",
      },
    ],
    isLoading: false,
    refetch: refetchMock,
  }),
  useUpdateAgendamentoStatus: () => ({
    isPending: false,
    mutateAsync: updateStatusMock,
  }),
}));

vi.mock("@/features/solicitacoes/api", () => ({
  useProfissionaisOptions: () => ({
    data: [{ especialidade: "Clinica geral", id: "prof-1", nome: "Dra. Ana" }],
  }),
  useSolicitacaoVinculadaQuery: () => ({
    data: {
      agendamento_id: "ag-1",
      canal_origem: "painel_admin",
      codigo_externo: "SOL-20260403-000001",
      created_at: "2026-04-03T10:00:00.000Z",
      data_hora_confirmada: "2026-04-05T17:30:00.000Z",
      dia_desejado: "2026-04-05",
      horario_desejado: "14:30:00",
      id: "sol-1",
      observacoes_admin: "Paciente confirmado.",
      observacoes_cliente: "Prefere periodo da tarde.",
      origem: "manual",
      procedimento_nome: "Consulta geral",
      status: "agendado",
    },
    isLoading: false,
  }),
}));

vi.mock("@/features/pacientes/api", () => ({
  usePacienteOperacaoContext: () => ({
    data: {
      matchedByPhone: false,
      paciente: {
        ativo: true,
        cpf: null,
        created_at: "2026-04-01T09:00:00.000Z",
        data_nascimento: null,
        email: "maria@clinica.com",
        endereco: null,
        id: "pac-1",
        nome: "Maria Souza",
        observacoes: null,
        telefone: "11999998888",
        updated_at: "2026-04-03T12:00:00.000Z",
      },
      recentesAgendamentos: [],
      recentesSolicitacoes: [],
    },
    isLoading: false,
  }),
}));

describe("Agenda page", () => {
  beforeEach(() => {
    updateStatusMock.mockReset();
    refetchMock.mockReset();
    updateStatusMock.mockResolvedValue({
      id: "ag-1",
      status: "concluido",
    });
  });

  it("updates the selected appointment status", async () => {
    render(
      <TestMemoryRouter>
        <Agenda />
      </TestMemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/status do agendamento/i), {
      target: { value: "concluido" },
    });
    fireEvent.change(screen.getByLabelText(/observacoes/i), {
      target: { value: "Atendimento realizado com sucesso." },
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/status do agendamento/i)).toHaveValue("concluido");
      expect(screen.getByLabelText(/observacoes/i)).toHaveValue("Atendimento realizado com sucesso.");
    });

    fireEvent.click(screen.getByRole("button", { name: /salvar atualizacao/i }));

    await waitFor(() => {
      expect(updateStatusMock).toHaveBeenCalledWith({
        id: "ag-1",
        observacoes: "Atendimento realizado com sucesso.",
        status: "concluido",
      });
    });
  });
});
