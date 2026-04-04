import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endOfDay, startOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

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

function mergeNoteBlocks(...values: Array<string | null | undefined>) {
  const notes = values.map((value) => value?.trim()).filter(Boolean);
  return notes.length > 0 ? notes.join("\n\n") : null;
}

function mapSolicitacaoStatusFromAgendamento(status: AgendamentoStatus) {
  if (status === "cancelado") {
    return "cancelado";
  }

  if (status === "remarcado") {
    return "remarcacao_solicitada";
  }

  if (status === "confirmado") {
    return "agendado";
  }

  return null;
}

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
    queryKey: ["agendamentos-admin", filters],
    queryFn: async () => {
      const date = filters.date ? new Date(`${filters.date}T12:00:00`) : new Date();

      let query = supabase
        .from("agendamentos")
        .select(
          "id, paciente_id, profissional_id, servico_id, data_hora, duracao_minutos, status, origem, observacoes, created_at, updated_at",
        )
        .gte("data_hora", startOfDay(date).toISOString())
        .lte("data_hora", endOfDay(date).toISOString())
        .order("data_hora", { ascending: true });

      if (filters.profissionalId) {
        query = query.eq("profissional_id", filters.profissionalId);
      }

      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const items = (data ?? []) as AgendamentoRecord[];

      if (items.length === 0) {
        return [] as AgendamentoViewRecord[];
      }

      const pacienteIds = [...new Set(items.map((item) => item.paciente_id))];
      const profissionalIds = [...new Set(items.map((item) => item.profissional_id))];
      const servicoIds = [...new Set(items.flatMap((item) => (item.servico_id ? [item.servico_id] : [])))];

      const [pacientes, profissionais, servicos] = await Promise.all([
        supabase.from("pacientes").select("id, nome").in("id", pacienteIds),
        supabase.from("profissionais").select("id, nome").in("id", profissionalIds),
        servicoIds.length > 0
          ? supabase.from("servicos").select("id, nome").in("id", servicoIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (pacientes.error) {
        throw pacientes.error;
      }

      if (profissionais.error) {
        throw profissionais.error;
      }

      if (servicos.error) {
        throw servicos.error;
      }

      const pacienteMap = Object.fromEntries((pacientes.data ?? []).map((item) => [item.id, item.nome]));
      const profissionalMap = Object.fromEntries((profissionais.data ?? []).map((item) => [item.id, item.nome]));
      const servicoMap = Object.fromEntries((servicos.data ?? []).map((item) => [item.id, item.nome]));

      return items.map((item) => ({
        ...item,
        paciente_nome: pacienteMap[item.paciente_id] ?? "Paciente",
        profissional_nome: profissionalMap[item.profissional_id] ?? "Profissional",
        servico_nome: item.servico_id ? servicoMap[item.servico_id] ?? "Servico" : "Servico livre",
      }));
    },
  });
}

export function useUpdateAgendamentoStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateAgendamentoStatusInput) => {
      const payload: TablesUpdate<"agendamentos"> = {
        observacoes: input.observacoes ?? null,
        status: input.status,
      };

      const { data, error } = await supabase
        .from("agendamentos")
        .update(payload)
        .eq("id", input.id)
        .select(
          "id, paciente_id, profissional_id, servico_id, data_hora, duracao_minutos, status, origem, observacoes, created_at, updated_at",
        )
        .single();

      if (error) {
        throw error;
      }

      const { data: linkedSolicitacao, error: linkedSolicitacaoError } = await supabase
        .from("solicitacoes_agendamento")
        .select("id, observacoes_admin, status")
        .eq("agendamento_id", input.id)
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (linkedSolicitacaoError) {
        throw linkedSolicitacaoError;
      }

      if (linkedSolicitacao) {
        const nextStatus = mapSolicitacaoStatusFromAgendamento(input.status);
        const nextObservacoes = mergeNoteBlocks(linkedSolicitacao.observacoes_admin, input.observacoes);
        const solicitacaoPayload: TablesUpdate<"solicitacoes_agendamento"> = {};

        if (nextStatus && nextStatus !== linkedSolicitacao.status) {
          solicitacaoPayload.status = nextStatus;
        }

        if (nextObservacoes !== linkedSolicitacao.observacoes_admin) {
          solicitacaoPayload.observacoes_admin = nextObservacoes;
        }

        if (Object.keys(solicitacaoPayload).length > 0) {
          const { error: updateSolicitacaoError } = await supabase
            .from("solicitacoes_agendamento")
            .update(solicitacaoPayload)
            .eq("id", linkedSolicitacao.id);

          if (updateSolicitacaoError) {
            throw updateSolicitacaoError;
          }
        }
      }

      return data as AgendamentoRecord;
    },
    onSuccess: async () => {
      await invalidateAgendaData(queryClient);
    },
  });
}
