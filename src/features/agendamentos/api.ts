import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";
import { clinicApi } from "@/features/integrations/dental-api";
import { queryPresets } from "@/lib/react-query";

export const AGENDAMENTO_STATUS_OPTIONS = [
  "confirmado",
  "remarcado",
  "cancelado",
  "concluido",
  "faltou",
] as const;

export type AgendamentoStatus = (typeof AGENDAMENTO_STATUS_OPTIONS)[number];
export type AgendamentoRecord = Tables<"agendamentos">;

export type AgendamentoViewRecord = AgendamentoRecord & {
  paciente_nome?: string;
  profissional_nome?: string;
  servico_nome?: string;
};

export type AgendamentosFilters = {
  date: string;
  profissionalId: string;
  status: AgendamentoStatus | "all";
};

export type UpdateAgendamentoStatusInput = {
  id: string;
  observacoes?: string | null;
  status: AgendamentoStatus;
};

async function invalidateAgendaData(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["agendamentos-admin"] }),
    queryClient.invalidateQueries({ queryKey: ["paciente-operacao-context"] }),
    queryClient.invalidateQueries({ queryKey: ["solicitacao-vinculada"] }),
    queryClient.invalidateQueries({ queryKey: ["solicitacoes"] }),
    queryClient.invalidateQueries({ queryKey: ["overview"] }),
    queryClient.invalidateQueries({ queryKey: ["proximos-agendamentos"] }),
    queryClient.invalidateQueries({ queryKey: ["atividades-recentes"] }),
  ]);
}

export function useAgendamentosAdminQuery(filters: AgendamentosFilters) {
  return useQuery({
    ...queryPresets.operational,
    queryKey: ["agendamentos-admin", filters],
    queryFn: async () => {
      return clinicApi.appointments.list<AgendamentoViewRecord[]>({
        date: filters.date,
        profissionalId: filters.profissionalId || undefined,
        status: filters.status === "all" ? undefined : filters.status,
      });
    },
  });
}

export function useUpdateAgendamentoStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateAgendamentoStatusInput) => {
      return clinicApi.appointments.updateStatus<AgendamentoRecord>(input.id, {
        observacoes: input.observacoes ?? null,
        status: input.status,
      });
    },
    onSuccess: async () => {
      await invalidateAgendaData(queryClient);
    },
  });
}
