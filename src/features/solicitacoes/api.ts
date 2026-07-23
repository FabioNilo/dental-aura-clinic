import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";
import { clinicApi } from "@/features/integrations/dental-api";
import { getErrorMessage } from "@/lib/errors";
import { queryPresets } from "@/lib/react-query";

export const SOLICITACAO_STATUS_OPTIONS = [
  "novo",
  "em_triagem",
  "aguardando_confirmacao",
  "agendado",
  "remarcacao_solicitada",
  "cancelamento_solicitado",
  "cancelado",
] as const;

export const SOLICITACAO_PENDING_STATUSES = [
  "novo",
  "em_triagem",
  "aguardando_confirmacao",
  "remarcacao_solicitada",
  "cancelamento_solicitado",
] as const;

export type SolicitacaoStatus = (typeof SOLICITACAO_STATUS_OPTIONS)[number];
export type SolicitacaoRecord = Tables<"solicitacoes_agendamento">;
export type ProfissionalOption = Pick<Tables<"profissionais">, "id" | "nome" | "especialidade">;
export type ServicoOption = Pick<Tables<"servicos">, "id" | "nome" | "duracao_minutos" | "preco">;
export type SolicitacaoLinkedRecord = Pick<
  Tables<"solicitacoes_agendamento">,
  | "agendamento_id"
  | "canal_origem"
  | "codigo_externo"
  | "created_at"
  | "data_hora_confirmada"
  | "dia_desejado"
  | "horario_desejado"
  | "id"
  | "observacoes_admin"
  | "observacoes_cliente"
  | "origem"
  | "procedimento_nome"
  | "status"
>;

export type SolicitacaoFilters = {
  page: number;
  pageSize: number;
  search: string;
  status: SolicitacaoStatus | "all";
};

export type ConfirmarSolicitacaoInput = {
  dataHora: string;
  observacoesAdmin?: string;
  pacienteId?: string | null;
  profissionalId: string;
  servicoId: string;
  solicitacaoId: string;
};

export type AtualizarSolicitacaoInput = {
  observacoesAdmin?: string;
  solicitacaoId: string;
};

export type RemarcarSolicitacaoInput = {
  confirmaAtualizacaoAgendamento?: boolean;
  dataHora?: string | null;
  observacoesAdmin?: string;
  profissionalId?: string | null;
  servicoId?: string | null;
  solicitacaoId: string;
};

export type CreateSolicitacaoInput = {
  diaDesejado?: string | null;
  horarioDesejado?: string | null;
  nomeCliente: string;
  observacoesAdmin?: string | null;
  observacoesCliente?: string | null;
  procedimentoNome: string;
  telefoneCliente: string;
  tipoAtendimento?: "convenio" | "particular" | null;
};

type SolicitacaoRawRecord = Record<string, unknown>;

const SOLICITACOES_LIST_SELECT = `
  id,
  created_at,
  status,
  canal_origem,
  codigo_externo,
  nome_cliente,
  telefone_cliente,
  procedimento_nome,
  dia_desejado,
  horario_desejado
`;

const SOLICITACAO_DETAIL_SELECT_PREFERRED = `
  id,
  created_at,
  updated_at,
  status,
  origem,
  canal_origem,
  codigo_externo,
  paciente_id,
  agendamento_id,
  profissional_id,
  servico_id,
  nome_cliente,
  telefone_cliente,
  procedimento_nome,
  tipo_atendimento,
  dia_desejado,
  horario_desejado,
  data_hora_confirmada,
  observacoes_cliente,
  observacoes_admin,
  payload_externo,
  resumo_atendimento
`;

const SOLICITACAO_DETAIL_SELECT_FALLBACK = `
  id,
  created_at,
  updated_at,
  status,
  origem,
  canal_origem,
  codigo_externo,
  paciente_id,
  agendamento_id,
  profissional_id,
  servico_id,
  nome_cliente,
  telefone_cliente,
  procedimento_nome,
  dia_desejado,
  horario_desejado,
  data_hora_confirmada,
  observacoes_cliente,
  observacoes_admin
`;

function buildSearchExpression(search: string) {
  const safeSearch = search.trim().replace(/,/g, " ").replace(/\s+/g, " ");

  if (!safeSearch) {
    return null;
  }

  return [
    `nome_cliente.ilike.%${safeSearch}%`,
    `telefone_cliente.ilike.%${safeSearch}%`,
    `codigo_externo.ilike.%${safeSearch}%`,
    `procedimento_nome.ilike.%${safeSearch}%`,
  ].join(",");
}

async function invalidateClinicData(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["solicitacao"] }),
    queryClient.invalidateQueries({ queryKey: ["paciente-operacao-context"] }),
    queryClient.invalidateQueries({ queryKey: ["solicitacao-vinculada"] }),
    queryClient.invalidateQueries({ queryKey: ["solicitacoes"] }),
    queryClient.invalidateQueries({ queryKey: ["overview"] }),
    queryClient.invalidateQueries({ queryKey: ["atividades-recentes"] }),
    queryClient.invalidateQueries({ queryKey: ["proximos-agendamentos"] }),
    queryClient.invalidateQueries({ queryKey: ["chart-agendamentos-semana"] }),
  ]);
}

function isRpcSignatureMismatch(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String(error.code ?? "") : "";
  const message = "message" in error ? String(error.message ?? "") : "";

  return (
    code === "PGRST202" ||
    code === "PGRST203" ||
    message.includes("Could not find the function public.remarcar_solicitacao_agendamento") ||
    message.includes("remarcar_solicitacao_agendamento")
  );
}

function isSchemaMismatchError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String(error.code ?? "") : "";
  const message = "message" in error ? String(error.message ?? "") : "";

  return (
    code === "PGRST100" ||
    code === "PGRST116" ||
    code === "PGRST204" ||
    message.includes("Could not find") ||
    message.includes("column") ||
    message.includes("schema cache")
  );
}

function toQueryError(error: unknown, fallback: string) {
  return new Error(getErrorMessage(error, fallback));
}

function normalizeSolicitacaoRecord(record: SolicitacaoRawRecord) {
  return {
    agendamento_id: typeof record.agendamento_id === "string" ? record.agendamento_id : null,
    canal_origem: typeof record.canal_origem === "string" ? record.canal_origem : "manual",
    codigo_externo: typeof record.codigo_externo === "string" ? record.codigo_externo : "Sem codigo",
    created_at: typeof record.created_at === "string" ? record.created_at : new Date(0).toISOString(),
    data_hora_confirmada:
      typeof record.data_hora_confirmada === "string" ? record.data_hora_confirmada : null,
    dia_desejado: typeof record.dia_desejado === "string" ? record.dia_desejado : null,
    horario_desejado:
      typeof record.horario_desejado === "string" ? record.horario_desejado : null,
    id: typeof record.id === "string" ? record.id : crypto.randomUUID(),
    nome_cliente: typeof record.nome_cliente === "string" ? record.nome_cliente : "Paciente",
    observacoes_admin: typeof record.observacoes_admin === "string" ? record.observacoes_admin : null,
    observacoes_cliente:
      typeof record.observacoes_cliente === "string" ? record.observacoes_cliente : null,
    origem: typeof record.origem === "string" ? record.origem : "manual",
    paciente_id: typeof record.paciente_id === "string" ? record.paciente_id : null,
    payload_externo: (record.payload_externo ?? null) as SolicitacaoRecord["payload_externo"],
    procedimento_nome:
      typeof record.procedimento_nome === "string" ? record.procedimento_nome : "Procedimento",
    profissional_id: typeof record.profissional_id === "string" ? record.profissional_id : null,
    resumo_atendimento: (record.resumo_atendimento ?? null) as SolicitacaoRecord["resumo_atendimento"],
    servico_id: typeof record.servico_id === "string" ? record.servico_id : null,
    status: typeof record.status === "string" ? record.status : "novo",
    telefone_cliente:
      typeof record.telefone_cliente === "string" ? record.telefone_cliente : "Nao informado",
    tipo_atendimento:
      record.tipo_atendimento === "convenio" || record.tipo_atendimento === "particular"
        ? record.tipo_atendimento
        : null,
    updated_at: typeof record.updated_at === "string" ? record.updated_at : new Date(0).toISOString(),
  } satisfies SolicitacaoRecord;
}

export function useSolicitacoesQuery(filters: SolicitacaoFilters) {
  return useQuery({
    ...queryPresets.search,
    queryKey: ["solicitacoes", filters],
    queryFn: async () => {
      const result = await clinicApi.requests.list<SolicitacaoRawRecord>({
        page: filters.page,
        pageSize: filters.pageSize,
        search: filters.search,
        status: filters.status === "all" ? undefined : filters.status,
      });

      return {
        count: result.count ?? 0,
        items: result.items.map((item) => normalizeSolicitacaoRecord(item)),
        page: filters.page,
        pageSize: filters.pageSize,
      };
    },
    placeholderData: keepPreviousData,
  });
}

export function useProfissionaisOptions() {
  return useQuery({
    ...queryPresets.static,
    queryKey: ["profissionais-options"],
    queryFn: async () => {
      return clinicApi.professionals.options<ProfissionalOption>();
    },
  });
}

export function useServicosOptions() {
  return useQuery({
    ...queryPresets.static,
    queryKey: ["servicos-options"],
    queryFn: async () => {
      return clinicApi.services.options<ServicoOption>();
    },
  });
}

export function useSolicitacaoById(solicitacaoId?: string | null) {
  return useQuery({
    ...queryPresets.detail,
    enabled: Boolean(solicitacaoId),
    queryKey: ["solicitacao", solicitacaoId ?? null],
    queryFn: async () => {
      return clinicApi.requests.byId<SolicitacaoRecord>(solicitacaoId!);
    },
  });
}

export function useSolicitacaoVinculadaQuery(agendamentoId?: string | null) {
  return useQuery({
    ...queryPresets.detail,
    enabled: Boolean(agendamentoId),
    queryKey: ["solicitacao-vinculada", agendamentoId ?? null],
    queryFn: async () => {
      return clinicApi.requests.byAppointment<SolicitacaoLinkedRecord>(agendamentoId!);
    },
  });
}

export function useConfirmarSolicitacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ConfirmarSolicitacaoInput) => {
      return clinicApi.requests.confirm(input.solicitacaoId, {
        dataHora: input.dataHora,
        observacoesAdmin: input.observacoesAdmin ?? null,
        pacienteId: input.pacienteId ?? null,
        profissionalId: input.profissionalId,
        servicoId: input.servicoId,
      });
    },
    onSuccess: async () => {
      await invalidateClinicData(queryClient);
    },
  });
}

export function useCreateSolicitacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSolicitacaoInput) => {
      const resumoAtendimento = {
        captado_por: "painel_admin",
        dia_desejado: input.diaDesejado ?? null,
        horario_desejado: input.horarioDesejado ?? null,
        nome_cliente: input.nomeCliente,
        observacoes_cliente: input.observacoesCliente ?? null,
        procedimento_nome: input.procedimentoNome,
        telefone_cliente: input.telefoneCliente,
        tipo_atendimento: input.tipoAtendimento ?? null,
      };

      const payload = {
        canal_origem: "painel_admin",
        dia_desejado: input.diaDesejado ?? null,
        horario_desejado: input.horarioDesejado ?? null,
        nome_cliente: input.nomeCliente,
        observacoes_admin: input.observacoesAdmin ?? null,
        observacoes_cliente: input.observacoesCliente ?? null,
        origem: "manual",
        payload_externo: {
          captado_por: "painel_admin",
          criado_em: new Date().toISOString(),
        },
        procedimento_nome: input.procedimentoNome,
        resumo_atendimento: resumoAtendimento,
        status: "aguardando_confirmacao",
        telefone_cliente: input.telefoneCliente,
        tipo_atendimento: input.tipoAtendimento ?? null,
      };

      return clinicApi.requests.create<SolicitacaoRecord>(payload);
    },
    onSuccess: async () => {
      await invalidateClinicData(queryClient);
    },
  });
}

export function useRemarcarSolicitacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RemarcarSolicitacaoInput) => {
      return clinicApi.requests.reschedule(input.solicitacaoId, {
        confirmaAtualizacaoAgendamento: input.confirmaAtualizacaoAgendamento ?? false,
        dataHora: input.dataHora ?? null,
        observacoesAdmin: input.observacoesAdmin ?? null,
        profissionalId: input.profissionalId ?? null,
        servicoId: input.servicoId ?? null,
      });
    },
    onSuccess: async () => {
      await invalidateClinicData(queryClient);
    },
  });
}

export function useCancelarSolicitacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AtualizarSolicitacaoInput) => {
      return clinicApi.requests.cancel(input.solicitacaoId, {
        observacoesAdmin: input.observacoesAdmin ?? null,
      });
    },
    onSuccess: async () => {
      await invalidateClinicData(queryClient);
    },
  });
}
