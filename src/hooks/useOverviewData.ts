import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { queryPresets } from "@/lib/react-query";
import type { OverviewChartPoint, OverviewKpis } from "@/types/api";

type AtividadeResumo = Pick<Tables<"atividades">, "created_at" | "descricao" | "id" | "tipo" | "titulo">;

type ProximoAgendamento = {
  detail: string;
  id: string;
  initials: string;
  name: string;
  time: string;
};

export function useOverviewKpis() {
  return useQuery({
    ...queryPresets.operational,
    queryKey: ["overview", "kpis"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("rpc_overview_kpis");

      if (error) {
        throw error;
      }

      const row = data?.[0];

      return {
        confirmacoes_ia_hoje: Number(row?.confirmacoes_ia_hoje ?? 0),
        pendencias_operacionais: Number(row?.pendencias_operacionais ?? 0),
        solicitacoes_hoje: Number(row?.solicitacoes_hoje ?? 0),
        total_pacientes: Number(row?.total_pacientes ?? 0),
      } satisfies OverviewKpis;
    },
  });
}

export function useOverviewChartData() {
  return useQuery({
    ...queryPresets.operational,
    queryKey: ["overview", "chart-semana"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("rpc_overview_chart_semana");

      if (error) {
        throw error;
      }

      return (data ?? []).map((row) => ({
        day: String(row.day ?? ""),
        value: Number(row.value ?? 0),
      })) satisfies OverviewChartPoint[];
    },
  });
}

export function useAtividadesRecentes() {
  return useQuery({
    ...queryPresets.operational,
    queryKey: ["overview", "atividades-recentes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atividades")
        .select("id, tipo, titulo, descricao, created_at")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) {
        throw error;
      }

      return (data ?? []) as AtividadeResumo[];
    },
  });
}

export function useProximosAgendamentos() {
  return useQuery({
    ...queryPresets.operational,
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
        return [] satisfies ProximoAgendamento[];
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
      }) satisfies ProximoAgendamento[];
    },
  });
}
