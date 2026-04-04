import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Solicitacoes from "@/pages/admin/Solicitacoes";

const confirmarMutateAsyncMock = vi.fn();
const remarcarMutateAsyncMock = vi.fn();
const cancelarMutateAsyncMock = vi.fn();
const createSolicitacaoMutateAsyncMock = vi.fn();
const refetchMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/features/solicitacoes/api", () => ({
  SOLICITACAO_PENDING_STATUSES: [
    "novo",
    "em_triagem",
    "aguardando_confirmacao",
    "remarcacao_solicitada",
    "cancelamento_solicitado",
  ],
  SOLICITACAO_STATUS_OPTIONS: [
    "novo",
    "em_triagem",
    "aguardando_confirmacao",
    "agendado",
    "remarcacao_solicitada",
    "cancelamento_solicitado",
    "cancelado",
  ],
  useSolicitacoesQuery: () => ({
    data: {
      count: 1,
      items: [
        {
          agendamento_id: null,
          canal_origem: "n8n",
          codigo_externo: "SOL-20260403-000001",
          created_at: "2026-04-03T12:00:00.000Z",
          data_hora_confirmada: null,
          dia_desejado: "2026-04-05",
          id: "sol-1",
          nome_cliente: "Maria Souza",
          observacoes_admin: null,
          observacoes_cliente: "Dor no molar",
          origem: "whatsapp",
          paciente_id: null,
          payload_externo: { canal: "whatsapp" },
          procedimento_nome: "Consulta geral",
          profissional_id: null,
          resumo_atendimento: { intencao: "agendar" },
          servico_id: null,
          status: "novo",
          telefone_cliente: "11999998888",
          tipo_atendimento: "particular",
          turno_desejado: "tarde",
          updated_at: "2026-04-03T12:00:00.000Z",
        },
      ],
      page: 1,
      pageSize: 10,
    },
    isLoading: false,
    refetch: refetchMock,
  }),
  useProfissionaisOptions: () => ({
    data: [{ id: "prof-1", nome: "Dra. Ana", especialidade: "Clinica geral" }],
  }),
  useServicosOptions: () => ({
    data: [{ duracao_minutos: 60, id: "serv-1", nome: "Consulta geral", preco: 180 }],
  }),
  useConfirmarSolicitacao: () => ({
    isPending: false,
    mutateAsync: confirmarMutateAsyncMock,
  }),
  useCreateSolicitacao: () => ({
    isPending: false,
    mutateAsync: createSolicitacaoMutateAsyncMock,
  }),
  useRemarcarSolicitacao: () => ({
    isPending: false,
    mutateAsync: remarcarMutateAsyncMock,
  }),
  useCancelarSolicitacao: () => ({
    isPending: false,
    mutateAsync: cancelarMutateAsyncMock,
  }),
}));

vi.mock("@/features/pacientes/api", () => ({
  usePacienteOperacaoContext: () => ({
    data: {
      matchedByPhone: true,
      paciente: {
        ativo: true,
        cpf: null,
        created_at: "2026-04-01T10:00:00.000Z",
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

describe("Solicitacoes page", () => {
  beforeEach(() => {
    confirmarMutateAsyncMock.mockReset();
    remarcarMutateAsyncMock.mockReset();
    cancelarMutateAsyncMock.mockReset();
    createSolicitacaoMutateAsyncMock.mockReset();
    refetchMock.mockReset();
    confirmarMutateAsyncMock.mockResolvedValue("ag-1");
    createSolicitacaoMutateAsyncMock.mockResolvedValue({
      agendamento_id: null,
      canal_origem: "painel_admin",
      codigo_externo: "SOL-20260403-000002",
      created_at: "2026-04-03T12:00:00.000Z",
      data_hora_confirmada: null,
      dia_desejado: "2026-04-08",
      id: "sol-2",
      nome_cliente: "Joao Pereira",
      observacoes_admin: "Ligou pela recepcao.",
      observacoes_cliente: "Prefere horario comercial.",
      origem: "manual",
      paciente_id: null,
      payload_externo: { captado_por: "painel_admin" },
      procedimento_nome: "Avaliacao",
      profissional_id: null,
      resumo_atendimento: { captado_por: "painel_admin" },
      servico_id: null,
      status: "aguardando_confirmacao",
      telefone_cliente: "11977776666",
      tipo_atendimento: "particular",
      turno_desejado: "comercial",
      updated_at: "2026-04-03T12:00:00.000Z",
    });
  });

  it("opens the selected request and confirms it with the chosen data", async () => {
    render(
      <MemoryRouter>
        <Solicitacoes />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    fireEvent.change(screen.getByLabelText("Profissional"), {
      target: { value: "prof-1" },
    });
    fireEvent.change(screen.getByLabelText("Servico"), {
      target: { value: "serv-1" },
    });
    fireEvent.change(screen.getByLabelText("Data e hora"), {
      target: { value: "2026-04-05T14:30" },
    });
    fireEvent.change(screen.getByLabelText("Observacoes admin"), {
      target: { value: "Paciente confirmado no periodo da tarde." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar solicitacao" }));

    await waitFor(() => {
      expect(confirmarMutateAsyncMock).toHaveBeenCalledWith({
        dataHora: new Date("2026-04-05T14:30").toISOString(),
        observacoesAdmin: "Paciente confirmado no periodo da tarde.",
        profissionalId: "prof-1",
        servicoId: "serv-1",
        solicitacaoId: "sol-1",
      });
    });
  });

  it("creates a manual request from the admin panel", async () => {
    render(
      <MemoryRouter>
        <Solicitacoes />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Nova solicitacao" }));
    fireEvent.change(screen.getByLabelText("Nome do paciente"), {
      target: { value: "Joao Pereira" },
    });
    fireEvent.change(screen.getByLabelText("Telefone"), {
      target: { value: "11977776666" },
    });
    fireEvent.change(screen.getByLabelText("Procedimento"), {
      target: { value: "Avaliacao" },
    });
    fireEvent.change(screen.getByLabelText("Dia desejado"), {
      target: { value: "2026-04-08" },
    });
    fireEvent.change(screen.getByLabelText("Turno desejado"), {
      target: { value: "comercial" },
    });
    fireEvent.change(screen.getByLabelText("Tipo de atendimento"), {
      target: { value: "particular" },
    });
    fireEvent.change(screen.getByLabelText("Observacoes do contato"), {
      target: { value: "Prefere horario comercial." },
    });
    fireEvent.change(screen.getByLabelText("Observacoes admin"), {
      target: { value: "Ligou pela recepcao." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar solicitacao" }));

    await waitFor(() => {
      expect(createSolicitacaoMutateAsyncMock).toHaveBeenCalledWith({
        diaDesejado: "2026-04-08",
        nomeCliente: "Joao Pereira",
        observacoesAdmin: "Ligou pela recepcao.",
        observacoesCliente: "Prefere horario comercial.",
        procedimentoNome: "Avaliacao",
        telefoneCliente: "11977776666",
        tipoAtendimento: "particular",
        turnoDesejado: "comercial",
      });
    });
  });
});
