import { useQuery } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";
import { clinicApi } from "@/features/integrations/dental-api";
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
      return clinicApi.overview.kpis<OverviewKpis>();
    },
  });
}

export function useOverviewChartData() {
  return useQuery({
    ...queryPresets.operational,
    queryKey: ["overview", "chart-semana"],
    queryFn: async () => {
      return clinicApi.overview.chartWeek<OverviewChartPoint[]>();
    },
  });
}

export function useAtividadesRecentes() {
  return useQuery({
    ...queryPresets.operational,
    queryKey: ["overview", "atividades-recentes"],
    queryFn: async () => {
      return clinicApi.overview.activities<AtividadeResumo[]>();
    },
  });
}

export function useProximosAgendamentos() {
  return useQuery({
    ...queryPresets.operational,
    queryKey: ["proximos-agendamentos"],
    queryFn: async () => {
      return clinicApi.overview.upcomingAppointments<ProximoAgendamento[]>();
    },
  });
}
