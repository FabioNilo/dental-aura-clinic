import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

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
  | "id"
  | "observacoes_admin"
  | "observacoes_cliente"
  | "origem"
  | "procedimento_nome"
  | "status"
  | "turno_desejado"
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
  profissionalId: string;
  servicoId: string;
  solicitacaoId: string;
};

export type AtualizarSolicitacaoInput = {
  observacoesAdmin?: string;
  solicitacaoId: string;
};

export type CreateSolicitacaoInput = {
  diaDesejado?: string | null;
  nomeCliente: string;
  observacoesAdmin?: string | null;
  observacoesCliente?: string | null;
  procedimentoNome: string;
  telefoneCliente: string;
  tipoAtendimento?: "convenio" | "particular" | null;
  turnoDesejado?: "comercial" | "manha" | "noite" | "tarde" | null;
};

const SOLICITACOES_SELECT = `
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
  turno_desejado,
  data_hora_confirmada,
  observacoes_cliente,
  observacoes_admin,
  payload_externo,
  resumo_atendimento
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
    queryClient.invalidateQueries({ queryKey: ["paciente-operacao-context"] }),
    queryClient.invalidateQueries({ queryKey: ["solicitacao-vinculada"] }),
    queryClient.invalidateQueries({ queryKey: ["solicitacoes"] }),
    queryClient.invalidateQueries({ queryKey: ["overview"] }),
    queryClient.invalidateQueries({ queryKey: ["atividades-recentes"] }),
    queryClient.invalidateQueries({ queryKey: ["proximos-agendamentos"] }),
    queryClient.invalidateQueries({ queryKey: ["chart-agendamentos-semana"] }),
  ]);
}

export function useSolicitacoesQuery(filters: SolicitacaoFilters) {
  return useQuery({
    queryKey: ["solicitacoes", filters],
    queryFn: async () => {
      const from = (filters.page - 1) * filters.pageSize;
      const to = from + filters.pageSize - 1;

      let query = supabase
        .from("solicitacoes_agendamento")
        .select(SOLICITACOES_SELECT, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      const searchExpression = buildSearchExpression(filters.search);

      if (searchExpression) {
        query = query.or(searchExpression);
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        count: count ?? 0,
        items: (data ?? []) as SolicitacaoRecord[],
        page: filters.page,
        pageSize: filters.pageSize,
      };
    },
    placeholderData: (previousData) => previousData,
  });
}

export function useProfissionaisOptions() {
  return useQuery({
    queryKey: ["profissionais-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profissionais")
        .select("id, nome, especialidade")
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []) as ProfissionalOption[];
    },
  });
}

export function useServicosOptions() {
  return useQuery({
    queryKey: ["servicos-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servicos")
        .select("id, nome, duracao_minutos, preco")
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []) as ServicoOption[];
    },
  });
}

export function useSolicitacaoVinculadaQuery(agendamentoId?: string | null) {
  return useQuery({
    enabled: Boolean(agendamentoId),
    queryKey: ["solicitacao-vinculada", agendamentoId ?? null],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_agendamento")
        .select(
          "id, agendamento_id, codigo_externo, status, origem, canal_origem, procedimento_nome, dia_desejado, turno_desejado, data_hora_confirmada, observacoes_cliente, observacoes_admin, created_at",
        )
        .eq("agendamento_id", agendamentoId!)
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (error) {
        throw error;
      }

      return (data ?? null) as SolicitacaoLinkedRecord | null;
    },
  });
}

export function useConfirmarSolicitacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ConfirmarSolicitacaoInput) => {
      const { data, error } = await supabase.rpc("confirmar_solicitacao_agendamento", {
        p_data_hora: input.dataHora,
        p_observacoes_admin: input.observacoesAdmin ?? null,
        p_profissional_id: input.profissionalId,
        p_servico_id: input.servicoId,
        p_solicitacao_id: input.solicitacaoId,
      });

      if (error) {
        throw error;
      }

      return data;
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
        nome_cliente: input.nomeCliente,
        observacoes_cliente: input.observacoesCliente ?? null,
        procedimento_nome: input.procedimentoNome,
        telefone_cliente: input.telefoneCliente,
        tipo_atendimento: input.tipoAtendimento ?? null,
        turno_desejado: input.turnoDesejado ?? null,
      };

      const payload: TablesInsert<"solicitacoes_agendamento"> = {
        canal_origem: "painel_admin",
        dia_desejado: input.diaDesejado ?? null,
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
        turno_desejado: input.turnoDesejado ?? null,
      };

      const { data, error } = await supabase
        .from("solicitacoes_agendamento")
        .insert(payload)
        .select(SOLICITACOES_SELECT)
        .single();

      if (error) {
        throw error;
      }

      return data as SolicitacaoRecord;
    },
    onSuccess: async () => {
      await invalidateClinicData(queryClient);
    },
  });
}

export function useRemarcarSolicitacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AtualizarSolicitacaoInput) => {
      const { data, error } = await supabase.rpc("remarcar_solicitacao_agendamento", {
        p_observacoes_admin: input.observacoesAdmin ?? null,
        p_solicitacao_id: input.solicitacaoId,
      });

      if (error) {
        throw error;
      }

      return data;
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
      const { data, error } = await supabase.rpc("cancelar_solicitacao_agendamento", {
        p_observacoes_admin: input.observacoesAdmin ?? null,
        p_solicitacao_id: input.solicitacaoId,
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: async () => {
      await invalidateClinicData(queryClient);
    },
  });
}
