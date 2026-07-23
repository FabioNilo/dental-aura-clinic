import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clinicApi } from "@/features/integrations/dental-api";
import { queryPresets } from "@/lib/react-query";
import type { FinanceiroResumoRow, PaginatedResult } from "@/types/api";
import {
  type CreateCupomInput,
  type CreateFaturaInput,
  type CreateOrcamentoInput,
  type CreatePagamentoInput,
  type CreateServicoInput,
  type CupomDesconto,
  type Fatura,
  type FaturaFilters,
  type FaturaItem,
  type FaturaListItem,
  type Orcamento,
  type OrcamentoFilters,
  type OrcamentoItem,
  type OrcamentoListItem,
  type PacienteComDebito,
  type Pagamento,
  type RelatorioFinanceiro,
  type Servico,
  type UpdateFaturaInput,
  type UpdateOrcamentoInput,
  type UpdateServicoInput,
} from "./types";
import { buildPagination, invalidateFinanceiroData } from "./query-helpers";

export interface PacienteComCPF {
  cpf?: string;
  email?: string;
  id: string;
  nome: string;
  telefone?: string;
}

type FinanceiroResumoFilters = {
  dataFim: string;
  dataInicio: string;
  pacienteId?: string;
};

type FinanceiroDevedoresFilters = {
  limit?: number;
  pacienteId?: string;
};

function mapFinanceiroResumo(
  row: Partial<FinanceiroResumoRow> | null | undefined,
  filters: FinanceiroResumoFilters,
): RelatorioFinanceiro {
  return {
    periodo: {
      fim: filters.dataFim,
      inicio: filters.dataInicio,
    },
    quantidade_faturas: Number(row?.quantidade_faturas ?? 0),
    quantidade_faturas_pagas: Number(row?.quantidade_faturas_pagas ?? 0),
    quantidade_faturas_pendentes: Number(row?.quantidade_faturas_pendentes ?? 0),
    taxa_recebimento: Number(row?.taxa_recebimento ?? 0),
    total_desconto_aplicado: Number(row?.total_desconto_aplicado ?? 0),
    total_faturado: Number(row?.total_faturado ?? 0),
    total_pendente: Number(row?.total_pendente ?? 0),
    total_recebido: Number(row?.total_recebido ?? 0),
    total_vencido: Number(row?.total_vencido ?? 0),
  };
}

function withPagination(filters?: { page?: number; pageSize?: number; limit?: number; offset?: number }) {
  const pagination = buildPagination(filters);
  return {
    from: pagination.from,
    page: pagination.page,
    pageSize: pagination.pageSize,
    to: pagination.to,
  };
}

export function useServicos() {
  return useQuery({
    ...queryPresets.static,
    queryKey: ["servicos-options"],
    queryFn: async () => clinicApi.finance.services<Servico>(),
  });
}

export function useCriarServico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateServicoInput) => clinicApi.finance.createService<Servico>(input),
    onSuccess: async () => {
      await invalidateFinanceiroData(queryClient);
    },
  });
}

export function useAtualizarServico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateServicoInput) => {
      const { id, ...payload } = input;
      return clinicApi.finance.updateService<Servico>(id, payload);
    },
    onSuccess: async () => {
      await invalidateFinanceiroData(queryClient);
    },
  });
}

export function useBuscarPacientes(termoBusca: string) {
  return useQuery({
    ...queryPresets.search,
    enabled: termoBusca.length >= 2,
    queryKey: ["pacientes-busca", termoBusca],
    queryFn: async () => {
      if (!termoBusca || termoBusca.length < 2) {
        return [] as PacienteComCPF[];
      }

      return clinicApi.finance.searchPatients<PacienteComCPF>(termoBusca);
    },
  });
}

export function useOrcamentosPaciente(pacienteId: string, filters?: Partial<OrcamentoFilters>) {
  const pagination = withPagination(filters);

  return useQuery({
    ...queryPresets.operational,
    enabled: Boolean(pacienteId),
    placeholderData: keepPreviousData,
    queryKey: ["orcamentos-paciente", pacienteId, { ...filters, ...pagination }],
    queryFn: async () =>
      clinicApi.finance.budgets<OrcamentoListItem>({
        ...filters,
        paciente_id: pacienteId,
        page: pagination.page,
        pageSize: pagination.pageSize,
      }) as Promise<PaginatedResult<OrcamentoListItem>>,
  });
}

export function useOrcamentoById(orcamentoId: string | null | undefined) {
  return useQuery({
    ...queryPresets.detail,
    enabled: Boolean(orcamentoId),
    queryKey: ["orcamento", orcamentoId ?? null],
    queryFn: async () =>
      clinicApi.finance.budgetById<Orcamento & { orcamento_itens: OrcamentoItem[] }>(orcamentoId!),
  });
}

export function useCriarOrcamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOrcamentoInput) =>
      clinicApi.finance.createBudget<Orcamento>(input as Record<string, unknown>),
    onSuccess: async () => {
      await invalidateFinanceiroData(queryClient);
    },
  });
}

export function useAtualizarOrcamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateOrcamentoInput) => {
      const { id, ...payload } = input;
      return clinicApi.finance.updateBudget<Orcamento>(id, payload as Record<string, unknown>);
    },
    onSuccess: async () => {
      await invalidateFinanceiroData(queryClient);
    },
  });
}

export function useConverterOrcamentoEmFatura() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dataVencimento,
      numeroNF,
      orcamentoId,
    }: {
      dataVencimento?: string;
      numeroNF?: string;
      orcamentoId: string;
    }) =>
      clinicApi.finance.convertBudgetToInvoice<Fatura>(orcamentoId, {
        dataVencimento,
        numeroNF,
      }),
    onSuccess: async () => {
      await invalidateFinanceiroData(queryClient);
    },
  });
}

export function useFaturasPaciente(pacienteId: string, filters?: Partial<FaturaFilters>) {
  const pagination = withPagination(filters);

  return useQuery({
    ...queryPresets.operational,
    enabled: Boolean(pacienteId),
    placeholderData: keepPreviousData,
    queryKey: ["faturas-paciente", pacienteId, { ...filters, ...pagination }],
    queryFn: async () =>
      clinicApi.finance.invoices<FaturaListItem>({
        ...filters,
        paciente_id: pacienteId,
        page: pagination.page,
        pageSize: pagination.pageSize,
      }) as Promise<PaginatedResult<FaturaListItem>>,
  });
}

export function useFaturas(filters?: Partial<FaturaFilters>) {
  const pagination = withPagination(filters);

  return useQuery({
    ...queryPresets.operational,
    placeholderData: keepPreviousData,
    queryKey: ["faturas", { ...filters, ...pagination }],
    queryFn: async () =>
      clinicApi.finance.invoices<FaturaListItem>({
        ...filters,
        page: pagination.page,
        pageSize: pagination.pageSize,
      }) as Promise<PaginatedResult<FaturaListItem>>,
  });
}

export function useFaturaById(faturaId: string | null | undefined) {
  return useQuery({
    ...queryPresets.detail,
    enabled: Boolean(faturaId),
    queryKey: ["fatura", faturaId ?? null],
    queryFn: async () =>
      clinicApi.finance.invoiceById<Fatura & { fatura_itens: FaturaItem[]; pagamentos: Pagamento[] }>(
        faturaId!,
      ),
  });
}

export function useCriarFatura() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFaturaInput) =>
      clinicApi.finance.createInvoice<Fatura>(input as Record<string, unknown>),
    onSuccess: async () => {
      await invalidateFinanceiroData(queryClient);
    },
  });
}

export function useAtualizarFatura() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateFaturaInput) => {
      const { id, ...payload } = input;
      return clinicApi.finance.updateInvoice<Fatura>(id, payload as Record<string, unknown>);
    },
    onSuccess: async () => {
      await invalidateFinanceiroData(queryClient);
    },
  });
}

export function useRegistrarPagamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePagamentoInput) =>
      clinicApi.finance.registerPayment<{ fatura_id: string; paciente_id: string; pagamento: Pagamento }>(
        input,
      ),
    onSuccess: async (data) => {
      await invalidateFinanceiroData(queryClient);
      await queryClient.invalidateQueries({ queryKey: ["fatura", data.fatura_id] });
    },
  });
}

export function useCupons() {
  return useQuery({
    ...queryPresets.static,
    queryKey: ["cupons"],
    queryFn: async () => clinicApi.finance.coupons<CupomDesconto>(),
  });
}

export function useCriarCupom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCupomInput) =>
      clinicApi.finance.createCoupon<CupomDesconto>(input as Record<string, unknown>),
    onSuccess: async () => {
      await invalidateFinanceiroData(queryClient);
    },
  });
}

export function useValidarCupom() {
  return useMutation({
    mutationFn: async (codigoCupom: string) =>
      clinicApi.finance.validateCoupon<CupomDesconto>(codigoCupom),
  });
}

export function useFinanceiroResumo(filters: FinanceiroResumoFilters) {
  return useQuery({
    ...queryPresets.operational,
    enabled: Boolean(filters.dataInicio && filters.dataFim),
    queryKey: ["financeiro-resumo", filters.dataInicio, filters.dataFim, filters.pacienteId ?? null],
    queryFn: async () => {
      const row = await clinicApi.finance.summary<FinanceiroResumoRow | null>({
        dataFim: filters.dataFim,
        dataInicio: filters.dataInicio,
        pacienteId: filters.pacienteId,
      });

      return mapFinanceiroResumo(row, filters);
    },
  });
}

export function useFinanceiroDevedores(filters?: FinanceiroDevedoresFilters) {
  const limit = filters?.limit ?? 20;

  return useQuery({
    ...queryPresets.operational,
    queryKey: ["financeiro-devedores", limit, filters?.pacienteId ?? null],
    queryFn: async () =>
      clinicApi.finance.debtors<PacienteComDebito>({
        limit,
        pacienteId: filters?.pacienteId,
      }),
  });
}

export function useRelatorioFinanceiro(dataInicio: string, dataFim: string, pacienteId?: string) {
  return useFinanceiroResumo({ dataFim, dataInicio, pacienteId });
}

export function usePacientesComDebito() {
  return useFinanceiroDevedores({ limit: 20 });
}
