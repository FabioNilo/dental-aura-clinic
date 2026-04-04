import { useQuery } from "@tanstack/react-query";
import { endOfDay, format, startOfDay, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { SOLICITACAO_PENDING_STATUSES } from "@/features/solicitacoes/api";

export function useTotalPacientes() {
  return useQuery({
    queryKey: ["overview", "total-pacientes"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("pacientes")
        .select("*", { count: "exact", head: true })
        .eq("ativo", true);

      if (error) {
        throw error;
      }

      return count ?? 0;
    },
  });
}

export function useSolicitacoesHoje() {
  return useQuery({
    queryKey: ["overview", "solicitacoes-hoje"],
    queryFn: async () => {
      const now = new Date();
      const { count, error } = await supabase
        .from("solicitacoes_agendamento")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfDay(now).toISOString())
        .lte("created_at", endOfDay(now).toISOString());

      if (error) {
        throw error;
      }

      return count ?? 0;
    },
  });
}

export function useConfirmacoesIAHoje() {
  return useQuery({
    queryKey: ["overview", "confirmacoes-ia-hoje"],
    queryFn: async () => {
      const now = new Date();
      const { count, error } = await supabase
        .from("solicitacoes_agendamento")
        .select("*", { count: "exact", head: true })
        .eq("canal_origem", "n8n")
        .eq("status", "agendado")
        .gte("updated_at", startOfDay(now).toISOString())
        .lte("updated_at", endOfDay(now).toISOString());

      if (error) {
        throw error;
      }

      return count ?? 0;
    },
  });
}

export function usePendenciasOperacionais() {
  return useQuery({
    queryKey: ["overview", "pendencias-operacionais"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("solicitacoes_agendamento")
        .select("*", { count: "exact", head: true })
        .in("status", [...SOLICITACAO_PENDING_STATUSES]);

      if (error) {
        throw error;
      }

      return count ?? 0;
    },
  });
}

export function useChartData() {
  return useQuery({
    queryKey: ["chart-agendamentos-semana"],
    queryFn: async () => {
      const days: { day: string; value: number }[] = [];

      for (let index = 6; index >= 0; index -= 1) {
        const date = subDays(new Date(), index);
        const { count, error } = await supabase
          .from("solicitacoes_agendamento")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startOfDay(date).toISOString())
          .lte("created_at", endOfDay(date).toISOString());

        if (error) {
          throw error;
        }

        days.push({
          day: format(date, "dd/MM"),
          value: count ?? 0,
        });
      }

      return days;
    },
  });
}

export function useAtividadesRecentes() {
  return useQuery({
    queryKey: ["atividades-recentes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atividades")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) {
        throw error;
      }

      return data ?? [];
    },
  });
}

export function useProximosAgendamentos() {
  return useQuery({
    queryKey: ["proximos-agendamentos"],
    queryFn: async () => {
      const now = new Date();
      const { data, error } = await supabase
        .from("agendamentos")
        .select("id, data_hora, duracao_minutos, status, paciente_id, profissional_id, servico_id")
        .gte("data_hora", now.toISOString())
        .neq("status", "cancelado")
        .order("data_hora", { ascending: true })
        .limit(4);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      const pacienteIds = [...new Set(data.map((item) => item.paciente_id))];
      const profissionalIds = [...new Set(data.map((item) => item.profissional_id))];
      const servicoIds = [...new Set(data.flatMap((item) => (item.servico_id ? [item.servico_id] : [])))];

      const [pacientes, profissionais, servicos] = await Promise.all([
        pacienteIds.length > 0
          ? supabase.from("pacientes").select("id, nome").in("id", pacienteIds)
          : Promise.resolve({ data: [], error: null }),
        profissionalIds.length > 0
          ? supabase.from("profissionais").select("id, nome").in("id", profissionalIds)
          : Promise.resolve({ data: [], error: null }),
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

      return data.map((item) => {
        const start = new Date(item.data_hora);
        const end = new Date(start.getTime() + (item.duracao_minutos ?? 30) * 60000);
        const patientName = pacienteMap[item.paciente_id] ?? "Paciente";
        const initials = patientName
          .split(" ")
          .map((chunk) => chunk[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return {
          detail: [servicoMap[item.servico_id ?? ""], profissionalMap[item.profissional_id]]
            .filter(Boolean)
            .join(" - "),
          id: item.id,
          initials,
          name: patientName,
          time: `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`,
        };
      });
    },
  });
}
