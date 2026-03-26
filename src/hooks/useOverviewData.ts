import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export function useTotalPacientes() {
  return useQuery({
    queryKey: ["total-pacientes"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("pacientes")
        .select("*", { count: "exact", head: true })
        .eq("ativo", true);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useConsultasHoje() {
  return useQuery({
    queryKey: ["consultas-hoje"],
    queryFn: async () => {
      const now = new Date();
      const { count, error } = await supabase
        .from("agendamentos")
        .select("*", { count: "exact", head: true })
        .gte("data_hora", startOfDay(now).toISOString())
        .lte("data_hora", endOfDay(now).toISOString());
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useAgendamentosIA() {
  return useQuery({
    queryKey: ["agendamentos-ia"],
    queryFn: async () => {
      const now = new Date();
      const { count, error } = await supabase
        .from("agendamentos")
        .select("*", { count: "exact", head: true })
        .eq("origem", "ia")
        .gte("data_hora", startOfDay(now).toISOString())
        .lte("data_hora", endOfDay(now).toISOString());
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useEncaminhamentosUrgentes() {
  return useQuery({
    queryKey: ["encaminhamentos-urgentes"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("agendamentos")
        .select("*", { count: "exact", head: true })
        .eq("status", "urgente");
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useChartData() {
  return useQuery({
    queryKey: ["chart-agendamentos-semana"],
    queryFn: async () => {
      const days: { day: string; value: number }[] = [];
      const dayLabels = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const { count, error } = await supabase
          .from("agendamentos")
          .select("*", { count: "exact", head: true })
          .gte("data_hora", startOfDay(date).toISOString())
          .lte("data_hora", endOfDay(date).toISOString());
        if (error) throw error;
        days.push({
          day: dayLabels[date.getDay()],
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
        .limit(5);
      if (error) throw error;
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
        .select(`
          id,
          data_hora,
          duracao_minutos,
          status,
          paciente_id,
          profissional_id,
          servico_id
        `)
        .gte("data_hora", now.toISOString())
        .order("data_hora", { ascending: true })
        .limit(4);
      if (error) throw error;

      // Fetch related data
      if (!data || data.length === 0) return [];

      const pacienteIds = [...new Set(data.map((a) => a.paciente_id))];
      const profissionalIds = [...new Set(data.map((a) => a.profissional_id))];
      const servicoIds = [...new Set(data.filter((a) => a.servico_id).map((a) => a.servico_id!))];

      const [pacientes, profissionais, servicos] = await Promise.all([
        supabase.from("pacientes").select("id, nome").in("id", pacienteIds),
        supabase.from("profissionais").select("id, nome").in("id", profissionalIds),
        servicoIds.length > 0
          ? supabase.from("servicos").select("id, nome").in("id", servicoIds)
          : { data: [], error: null },
      ]);

      const pacMap = Object.fromEntries((pacientes.data ?? []).map((p) => [p.id, p.nome]));
      const profMap = Object.fromEntries((profissionais.data ?? []).map((p) => [p.id, p.nome]));
      const servMap = Object.fromEntries(((servicos as any).data ?? []).map((s: any) => [s.id, s.nome]));

      return data.map((a) => {
        const start = new Date(a.data_hora);
        const end = new Date(start.getTime() + (a.duracao_minutos ?? 30) * 60000);
        const timeStr = `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`;
        const nome = pacMap[a.paciente_id] ?? "Paciente";
        const initials = nome
          .split(" ")
          .map((w: string) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        const servico = a.servico_id ? servMap[a.servico_id] ?? "" : "";
        const prof = profMap[a.profissional_id] ?? "";
        const detail = [servico, prof].filter(Boolean).join(" - ");

        return { id: a.id, time: timeStr, name: nome, detail, initials };
      });
    },
  });
}
