import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";
import { clinicApi } from "@/features/integrations/dental-api";
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
  | "horario_desejado"
  | "id"
  | "procedimento_nome"
  | "status"
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
      return clinicApi.patients.list<PacienteListItem>({
        page: filters.page,
        pageSize: filters.pageSize,
        search: filters.search,
        status: filters.status,
      }) as Promise<PaginatedResult<PacienteListItem>>;
    },
  });
}

export function usePacienteById(pacienteId: string | null | undefined) {
  return useQuery({
    ...queryPresets.detail,
    enabled: Boolean(pacienteId),
    queryKey: ["paciente", pacienteId ?? null],
    queryFn: async () => {
      return clinicApi.patients.byId<PacienteRecord>(pacienteId!);
    },
  });
}

export function useCreatePaciente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SavePacienteInput) => {
      const payload = {
        ativo: input.ativo,
        cpf: input.cpf,
        data_nascimento: input.data_nascimento,
        email: input.email,
        endereco: input.endereco,
        nome: input.nome,
        observacoes: input.observacoes,
        telefone: input.telefone,
      };

      return clinicApi.patients.create<PacienteRecord>(payload);
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

      const payload = {
        ativo: input.ativo,
        cpf: input.cpf,
        data_nascimento: input.data_nascimento,
        email: input.email,
        endereco: input.endereco,
        nome: input.nome,
        observacoes: input.observacoes,
        telefone: input.telefone,
      };

      return clinicApi.patients.update<PacienteRecord>(input.id, payload);
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
      return clinicApi.patients.context<PacienteOperacaoContext>({
        limit: filters.limit ?? 5,
        pacienteId: filters.pacienteId || undefined,
        telefone: normalizedPhone || undefined,
      });
    },
  });
}
