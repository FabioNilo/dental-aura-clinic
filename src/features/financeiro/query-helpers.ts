import type { QueryClient } from "@tanstack/react-query";

type QueryLike = {
  eq: (column: string, value: string) => QueryLike;
  gte: (column: string, value: string) => QueryLike;
  in: (column: string, values: string[]) => QueryLike;
  lte: (column: string, value: string) => QueryLike;
  lt: (column: string, value: string) => QueryLike;
  order: (column: string, options: { ascending: boolean }) => QueryLike;
  range: (from: number, to: number) => QueryLike;
};

export function buildPagination(filters?: { limit?: number; offset?: number; page?: number; pageSize?: number }) {
  const pageSize = Math.max(1, filters?.pageSize ?? filters?.limit ?? 20);
  const offset = filters?.offset;
  const page = offset !== undefined ? Math.floor(offset / pageSize) + 1 : Math.max(1, filters?.page ?? 1);
  const from = offset ?? (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return { from, page, pageSize, to };
}

export function invalidateFinanceiroData(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["financeiro-resumo"] }),
    queryClient.invalidateQueries({ queryKey: ["financeiro-devedores"] }),
    queryClient.invalidateQueries({ queryKey: ["orcamentos-paciente"] }),
    queryClient.invalidateQueries({ queryKey: ["orcamento"] }),
    queryClient.invalidateQueries({ queryKey: ["faturas"] }),
    queryClient.invalidateQueries({ queryKey: ["faturas-paciente"] }),
    queryClient.invalidateQueries({ queryKey: ["fatura"] }),
    queryClient.invalidateQueries({ queryKey: ["cupons"] }),
    queryClient.invalidateQueries({ queryKey: ["servicos-options"] }),
  ]);
}

export function applyOrcamentoFilters(query: QueryLike, filters?: Partial<{ data_inicio?: string; data_fim?: string; status?: string | string[] }>) {
  let nextQuery = query;

  if (filters?.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    nextQuery = nextQuery.in("status", statuses);
  }

  if (filters?.data_inicio) {
    nextQuery = nextQuery.gte("data_emissao", filters.data_inicio);
  }

  if (filters?.data_fim) {
    nextQuery = nextQuery.lte("data_emissao", filters.data_fim);
  }

  return nextQuery;
}

export function applyFaturaFilters(query: QueryLike, filters?: Partial<{ apenas_vencidas?: boolean; data_fim?: string; data_inicio?: string; paciente_id?: string; status?: string | string[] }>) {
  let nextQuery = query;

  if (filters?.paciente_id) {
    nextQuery = nextQuery.eq("paciente_id", filters.paciente_id);
  }

  if (filters?.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    nextQuery = nextQuery.in("status", statuses);
  }

  if (filters?.data_inicio) {
    nextQuery = nextQuery.gte("data_emissao", filters.data_inicio);
  }

  if (filters?.data_fim) {
    nextQuery = nextQuery.lte("data_emissao", filters.data_fim);
  }

  if (filters?.apenas_vencidas) {
    const hoje = new Date().toISOString().split("T")[0];
    nextQuery = nextQuery.lt("data_vencimento", hoje);
  }

  return nextQuery;
}
