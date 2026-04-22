import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Overview from "@/pages/admin/Overview";
import { TestMemoryRouter } from "@/test/router";

vi.mock("recharts", () => {
  const Container = ({ children }: { children?: ReactNode }) => <div>{children}</div>;

  return {
    Bar: Container,
    BarChart: Container,
    Cell: () => null,
    ResponsiveContainer: Container,
    Tooltip: () => null,
    XAxis: () => null,
    YAxis: () => null,
  };
});

vi.mock("@/hooks/useOverviewData", () => ({
  useAtividadesRecentes: () => ({
    data: [
      {
        created_at: new Date().toISOString(),
        descricao: "Agendamento criado para avaliacao inicial.",
        id: "atividade-1",
        tipo: "agendamento_confirmado",
        titulo: "Agendamento confirmado",
      },
    ],
    isLoading: false,
  }),
  useOverviewChartData: () => ({
    data: [
      { day: "Seg", value: 4 },
      { day: "Ter", value: 7 },
    ],
    isLoading: false,
  }),
  useOverviewKpis: () => ({
    data: {
      confirmacoes_ia_hoje: 5,
      pendencias_operacionais: 3,
      solicitacoes_hoje: 7,
      total_pacientes: 1234,
    },
    isLoading: false,
  }),
  useProximosAgendamentos: () => ({
    data: [
      {
        detail: "Consulta geral - Dra. Ana",
        id: "ag-1",
        initials: "MS",
        name: "Maria Souza",
        time: "09:00 - 10:00",
      },
    ],
    isLoading: false,
  }),
}));

describe("Overview page", () => {
  it("renders operational KPIs, quick actions and upcoming appointments", () => {
    render(
      <TestMemoryRouter>
        <Overview />
      </TestMemoryRouter>,
    );

    expect(screen.getByText("Operacao da clinica")).toBeInTheDocument();
    expect(screen.getByText("1.234")).toBeInTheDocument();
    expect(screen.getByText("07")).toBeInTheDocument();
    expect(screen.getByText("05")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
    expect(screen.getByText("Abrir fila de solicitacoes")).toBeInTheDocument();
    expect(screen.getByText("Agendamento confirmado")).toBeInTheDocument();
    expect(screen.getByText("Maria Souza")).toBeInTheDocument();
    expect(screen.getByText("Consulta geral - Dra. Ana")).toBeInTheDocument();
  });
});
