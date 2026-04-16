import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { queryPresets } from "@/lib/react-query";
import type { PaginatedResult } from "@/types/api";

export type PacienteRecord = Tables<"pacientes">;
export type PacienteStatusFilter = "all" | "active" | "inactive";
export type PacienteListItem = Pick<
  Tables<"pacientes">,
  "ativo" | "cpf" | "data_nascimento" | "email" | "endereco" | "id" | "nome" | "observacoes" | "telefone"
>;
export type PacienteHistoricoAgendamento = Pick<
  Tables<"agendamentos">,
  "created_at" | "data_hora" | "duracao_minutos" | "id" | "origem" | "status"
> & {
  profissional_nome?: string;
  servico_nome?: string;
};
export type PacienteHistoricoSolicitacao = Pick<
  Tables<"solicitacoes_agendamento">,
  | "codigo_externo"
  | "created_at"
  | "data_hora_confirmada"
  | "dia_desejado"
  | "id"
  | "procedimento_nome"
  | "status"
  | "turno_desejado"
>;
export type PacienteOperacaoContext = {
  matchedByPhone: boolean;
  paciente: PacienteRecord | null;
  recentesAgendamentos: PacienteHistoricoAgendamento[];
  recentesSolicitacoes: PacienteHistoricoSolicitacao[];
};

export type PacientesListFilters = {
  page: number;
  pageSize: number;
  search: string;
  status: PacienteStatusFilter;
};

export type SavePacienteInput = {
  ativo: boolean;
  cpf: string | null;
  data_nascimento: string | null;
  email: string | null;
  endereco: string | null;
  id?: string;
  nome: string;
  observacoes: string | null;
  telefone: string | null;
};

type PacienteOperacaoFilters = {
  enabled?: boolean;
  limit?: number;
  pacienteId?: string | null;
  telefone?: string | null;
};

function normalizePhone(value: string | null | undefined) {
  return value?.replace(/\D/g, "") ?? "";
}

function invalidatePacienteData(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["pacientes-list"] }),
    queryClient.invalidateQueries({ queryKey: ["paciente"] }),
    queryClient.invalidateQueries({ queryKey: ["paciente-operacao-context"] }),
    queryClient.invalidateQueries({ queryKey: ["overview"] }),
    queryClient.invalidateQueries({ queryKey: ["proximos-agendamentos"] }),
  ]);
}

export function usePacientesListQuery(filters: PacientesListFilters) {
  return useQuery({
    ...queryPresets.search,
    placeholderData: keepPreviousData,
    queryKey: ["pacientes-list", filters],
    queryFn: async () => {
      const from = (filters.page - 1) * filters.pageSize;
      const to = from + filters.pageSize - 1;

      let query = supabase
        .from("pacientes")
        .select("id, nome, telefone, email, cpf, data_nascimento, endereco, observacoes, ativo", {
          count: "exact",
        })
        .order("ativo", { ascending: false })
        .order("nome", { ascending: true })
        .range(from, to);

      if (filters.status === "active") {
        query = query.eq("ativo", true);
      }

      if (filters.status === "inactive") {
        query = query.eq("ativo", false);
      }

      const safeSearch = filters.search.trim().replace(/,/g, " ").replace(/\s+/g, " ");

      if (safeSearch) {
        query = query.or(
          `nome.ilike.%${safeSearch}%,telefone.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%,cpf.ilike.%${safeSearch}%`,
        );
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        count: count ?? 0,
        items: (data ?? []) as PacienteListItem[],
        page: filters.page,
        pageSize: filters.pageSize,
      } satisfies PaginatedResult<PacienteListItem>;
    },
  });
}

export function usePacienteById(pacienteId: string | null | undefined) {
  return useQuery({
    ...queryPresets.detail,
    enabled: Boolean(pacienteId),
    queryKey: ["paciente", pacienteId ?? null],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pacientes")
        .select(
          "id, nome, telefone, email, cpf, data_nascimento, endereco, observacoes, ativo, created_at, updated_at",
        )
        .eq("id", pacienteId!)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return (data ?? null) as PacienteRecord | null;
    },
  });
}

export function useCreatePaciente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SavePacienteInput) => {
      const payload: TablesInsert<"pacientes"> = {
        ativo: input.ativo,
        cpf: input.cpf,
        data_nascimento: input.data_nascimento,
        email: input.email,
        endereco: input.endereco,
        nome: input.nome,
        observacoes: input.observacoes,
        telefone: input.telefone,
      };

      const { data, error } = await supabase
        .from("pacientes")
        .insert(payload)
        .select(
          "id, nome, telefone, email, cpf, data_nascimento, endereco, observacoes, ativo, created_at, updated_at",
        )
        .single();

      if (error) {
        throw error;
      }

      return data as PacienteRecord;
    },
    onSuccess: async () => {
      await invalidatePacienteData(queryClient);
    },
  });
}

export function useUpdatePaciente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SavePacienteInput) => {
      if (!input.id) {
        throw new Error("Paciente sem ID para atualizacao.");
      }

      const payload: TablesUpdate<"pacientes"> = {
        ativo: input.ativo,
        cpf: input.cpf,
        data_nascimento: input.data_nascimento,
        email: input.email,
        endereco: input.endereco,
        nome: input.nome,
        observacoes: input.observacoes,
        telefone: input.telefone,
      };

      const { data, error } = await supabase
        .from("pacientes")
        .update(payload)
        .eq("id", input.id)
        .select(
          "id, nome, telefone, email, cpf, data_nascimento, endereco, observacoes, ativo, created_at, updated_at",
        )
        .single();

      if (error) {
        throw error;
      }

      return data as PacienteRecord;
    },
    onSuccess: async () => {
      await invalidatePacienteData(queryClient);
    },
  });
}

export function usePacienteOperacaoContext(filters: PacienteOperacaoFilters) {
  const normalizedPhone = normalizePhone(filters.telefone);

  return useQuery({
    ...queryPresets.detail,
    enabled: (filters.enabled ?? true) && Boolean(filters.pacienteId || normalizedPhone),
    queryKey: ["paciente-operacao-context", filters.pacienteId ?? null, normalizedPhone, filters.limit ?? 5],
    queryFn: async () => {
      const limit = filters.limit ?? 5;
      let paciente: PacienteRecord | null = null;
      let matchedByPhone = false;

      if (filters.pacienteId) {
        const { data, error } = await supabase
          .from("pacientes")
          .select(
            "id, nome, telefone, email, cpf, data_nascimento, endereco, observacoes, ativo, created_at, updated_at",
          )
          .eq("id", filters.pacienteId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        paciente = (data ?? null) as PacienteRecord | null;
      }

      if (!paciente && normalizedPhone) {
        const phoneFragment = normalizedPhone.slice(-8);
        const { data, error } = await supabase
          .from("pacientes")
          .select(
            "id, nome, telefone, email, cpf, data_nascimento, endereco, observacoes, ativo, created_at, updated_at",
          )
          .ilike("telefone", `%${phoneFragment}%`)
          .limit(12);

        if (error) {
          throw error;
        }

        const match = (data ?? []).find((item) => normalizePhone(item.telefone) === normalizedPhone) ?? null;
        paciente = (match ?? null) as PacienteRecord | null;
        matchedByPhone = Boolean(match);
      }

      if (!paciente) {
        return {
          matchedByPhone: false,
          paciente: null,
          recentesAgendamentos: [],
          recentesSolicitacoes: [],
        } satisfies PacienteOperacaoContext;
      }

      const [agendamentosResult, solicitacoesResult] = await Promise.all([
        supabase
          .from("agendamentos")
          .select("id, data_hora, duracao_minutos, status, origem, created_at, profissional_id, servico_id")
          .eq("paciente_id", paciente.id)
          .order("data_hora", { ascending: false })
          .limit(limit),
        supabase
          .from("solicitacoes_agendamento")
          .select(
            "id, codigo_externo, status, procedimento_nome, created_at, dia_desejado, turno_desejado, data_hora_confirmada",
          )
          .eq("paciente_id", paciente.id)
          .order("created_at", { ascending: false })
          .limit(limit),
      ]);

      if (agendamentosResult.error) {
        throw agendamentosResult.error;
      }

      if (solicitacoesResult.error) {
        throw solicitacoesResult.error;
      }

      const agendamentos = agendamentosResult.data ?? [];
      const profissionalIds = [...new Set(agendamentos.map((item) => item.profissional_id))];
      const servicoIds = [...new Set(agendamentos.flatMap((item) => (item.servico_id ? [item.servico_id] : [])))];

      const [profissionaisResult, servicosResult] = await Promise.all([
        profissionalIds.length > 0
          ? supabase.from("profissionais").select("id, nome").in("id", profissionalIds)
          : Promise.resolve({ data: [], error: null }),
        servicoIds.length > 0
          ? supabase.from("servicos").select("id, nome").in("id", servicoIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (profissionaisResult.error) {
        throw profissionaisResult.error;
      }

      if (servicosResult.error) {
        throw servicosResult.error;
      }

      const profissionalMap = Object.fromEntries(
        (profissionaisResult.data ?? []).map((item) => [item.id, item.nome]),
      );
      const servicoMap = Object.fromEntries((servicosResult.data ?? []).map((item) => [item.id, item.nome]));

      return {
        matchedByPhone,
        paciente,
        recentesAgendamentos: agendamentos.map((item) => ({
          created_at: item.created_at,
          data_hora: item.data_hora,
          duracao_minutos: item.duracao_minutos,
          id: item.id,
          origem: item.origem,
          profissional_nome: profissionalMap[item.profissional_id] ?? "Profissional",
          servico_nome: item.servico_id ? servicoMap[item.servico_id] ?? "Servico" : "Servico livre",
          status: item.status,
        })),
        recentesSolicitacoes: (solicitacoesResult.data ?? []) as PacienteHistoricoSolicitacao[],
      } satisfies PacienteOperacaoContext;
    },
  });
}
