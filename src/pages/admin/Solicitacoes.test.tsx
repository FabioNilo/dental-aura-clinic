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
  useCancelarSolicitacao: () => ({
    isPending: false,
    mutateAsync: cancelarMutateAsyncMock,
  }),
  useConfirmarSolicitacao: () => ({
    isPending: false,
    mutateAsync: confirmarMutateAsyncMock,
  }),
  useCreateSolicitacao: () => ({
    isPending: false,
    mutateAsync: createSolicitacaoMutateAsyncMock,
  }),
  useProfissionaisOptions: () => ({
    data: [{ especialidade: "Clinica geral", id: "prof-1", nome: "Dra. Ana" }],
  }),
  useRemarcarSolicitacao: () => ({
    isPending: false,
    mutateAsync: remarcarMutateAsyncMock,
  }),
  useSolicitacaoById: () => ({
    data: {
      agendamento_id: "ag-1",
      canal_origem: "n8n",
      codigo_externo: "SOL-20260403-000001",
      created_at: "2026-04-03T12:00:00.000Z",
      data_hora_confirmada: "2026-04-05T17:30:00.000Z",
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
    isLoading: false,
  }),
  useServicosOptions: () => ({
    data: [{ duracao_minutos: 60, id: "serv-1", nome: "Consulta geral", preco: 180 }],
  }),
  useSolicitacoesQuery: () => ({
    data: {
      count: 1,
      items: [
        {
          agendamento_id: "ag-1",
          canal_origem: "n8n",
          codigo_externo: "SOL-20260403-000001",
          created_at: "2026-04-03T12:00:00.000Z",
          dia_desejado: "2026-04-05",
          id: "sol-1",
          nome_cliente: "Maria Souza",
          procedimento_nome: "Consulta geral",
          status: "novo",
          telefone_cliente: "11999998888",
          turno_desejado: "tarde",
        },
      ],
      page: 1,
      pageSize: 10,
    },
    isLoading: false,
    refetch: refetchMock,
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
    remarcarMutateAsyncMock.mockResolvedValue("sol-1");
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
    fireEvent.change(screen.getByLabelText(/profissional/i), {
      target: { value: "prof-1" },
    });
    fireEvent.change(screen.getByLabelText(/servi.o/i), {
      target: { value: "serv-1" },
    });
    fireEvent.change(screen.getByLabelText(/data e hora/i), {
      target: { value: "2026-04-05T14:30" },
    });
    fireEvent.change(screen.getByLabelText(/observa..es admin/i), {
      target: { value: "Paciente confirmado no periodo da tarde." },
    });
    fireEvent.click(screen.getByRole("button", { name: /confirmar solicita/i }));

    await waitFor(() => {
      expect(confirmarMutateAsyncMock).toHaveBeenCalledWith({
        dataHora: "2026-04-05T17:30:00.000Z",
        observacoesAdmin: "Paciente confirmado no periodo da tarde.",
        profissionalId: "prof-1",
        servicoId: "serv-1",
        solicitacaoId: "sol-1",
      });
    });
  });

  it("opens the remarcacao modal and saves a new proposed date", async () => {
    render(
      <MemoryRouter>
        <Solicitacoes />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remarcar" }));

    expect(screen.getByRole("dialog", { name: /remarcar solicitacao/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/nova data e hora/i), {
      target: { value: "2026-04-20T11:00" },
    });
    fireEvent.change(screen.getByLabelText(/profissional/i), {
      target: { value: "prof-1" },
    });
    fireEvent.change(screen.getByLabelText(/servico|servi.o/i), {
      target: { value: "serv-1" },
    });
    fireEvent.change(screen.getByLabelText(/observa..es da remarca/i), {
      target: { value: "Paciente pediu novo horario." },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /salvar remarcacao/i }));

    await waitFor(() => {
      expect(remarcarMutateAsyncMock).toHaveBeenCalledWith({
        confirmaAtualizacaoAgendamento: true,
        dataHora: "2026-04-20T14:00:00.000Z",
        observacoesAdmin: "Paciente pediu novo horario.",
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

    fireEvent.click(screen.getByRole("button", { name: /nova solicita/i }));
    fireEvent.change(screen.getByLabelText(/nome do paciente/i), {
      target: { value: "Joao Pereira" },
    });
    fireEvent.change(screen.getByLabelText(/telefone/i), {
      target: { value: "11977776666" },
    });
    fireEvent.change(screen.getByLabelText(/procedimento/i), {
      target: { value: "Avaliacao" },
    });
    fireEvent.change(screen.getByLabelText(/dia desejado/i), {
      target: { value: "2026-04-08" },
    });
    fireEvent.change(screen.getByLabelText(/turno desejado/i), {
      target: { value: "comercial" },
    });
    fireEvent.change(screen.getByLabelText(/tipo de atendimento/i), {
      target: { value: "particular" },
    });
    fireEvent.change(screen.getByLabelText(/observa..es do contato/i), {
      target: { value: "Prefere horario comercial." },
    });
    fireEvent.change(screen.getByLabelText(/observa..es admin/i), {
      target: { value: "Ligou pela recepcao." },
    });
    fireEvent.click(screen.getByRole("button", { name: /criar solicita/i }));

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
