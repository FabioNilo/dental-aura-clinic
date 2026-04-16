export type PaginatedResult<T> = {
  count: number;
  items: T[];
  page: number;
  pageSize: number;
};

export type OverviewKpis = {
  confirmacoes_ia_hoje: number;
  pendencias_operacionais: number;
  solicitacoes_hoje: number;
  total_pacientes: number;
};

export type OverviewChartPoint = {
  day: string;
  value: number;
};

export type FinanceiroResumoRow = {
  periodo_fim: string;
  periodo_inicio: string;
  quantidade_faturas: number;
  quantidade_faturas_pagas: number;
  quantidade_faturas_pendentes: number;
  taxa_recebimento: number;
  total_desconto_aplicado: number;
  total_faturado: number;
  total_pendente: number;
  total_recebido: number;
  total_vencido: number;
};

export type FinanceiroDevedorRow = {
  dias_atraso: number;
  email: string | null;
  nome: string;
  paciente_id: string;
  quantidade_faturas_vencidas: number;
  telefone: string | null;
  total_devido: number;
};
