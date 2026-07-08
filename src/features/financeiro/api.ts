/* eslint-disable @typescript-eslint/no-explicit-any */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import {
  applyFaturaFilters,
  applyOrcamentoFilters,
  buildPagination,
  invalidateFinanceiroData,
} from "./query-helpers";

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

// ============ SERVICOS ============

export function useServicos() {
  return useQuery({
    ...queryPresets.static,
    queryKey: ["servicos-options"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("servicos")
        .select("id, nome, preco, categoria, ativo")
        .eq("ativo", true)
        .order("nome");

      if (error) {
        throw error;
      }

      return data as Servico[];
    },
  });
}

export function useCriarServico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateServicoInput) => {
      const { data, error } = await (supabase as any)
        .from("servicos")
        .insert([input])
        .select("id, nome, descricao, preco, categoria, ativo, created_at, updated_at")
        .single();

      if (error) {
        throw error;
      }

      return data as Servico;
    },
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
      const { data, error } = await (supabase as any)
        .from("servicos")
        .update(payload)
        .eq("id", id)
        .select("id, nome, descricao, preco, categoria, ativo, created_at, updated_at")
        .single();

      if (error) {
        throw error;
      }

      return data as Servico;
    },
    onSuccess: async () => {
      await invalidateFinanceiroData(queryClient);
    },
  });
}

// ============ PACIENTES (para Orcamentos) ============

export function useBuscarPacientes(termoBusca: string) {
  return useQuery({
    ...queryPresets.search,
    enabled: termoBusca.length >= 2,
    queryKey: ["pacientes-busca", termoBusca],
    queryFn: async () => {
      if (!termoBusca || termoBusca.length < 2) {
        return [] as PacienteComCPF[];
      }

      const { data, error } = await (supabase as any)
        .from("pacientes")
        .select("id, nome, cpf, email, telefone")
        .ilike("nome", `%${termoBusca}%`)
        .order("nome")
        .limit(10);

      if (error) {
        throw error;
      }

      return data as PacienteComCPF[];
    },
  });
}

// ============ ORCAMENTOS ============

export function useOrcamentosPaciente(pacienteId: string, filters?: Partial<OrcamentoFilters>) {
  const pagination = buildPagination(filters);

  return useQuery({
    ...queryPresets.operational,
    enabled: Boolean(pacienteId),
    placeholderData: keepPreviousData,
    queryKey: ["orcamentos-paciente", pacienteId, { ...filters, ...pagination }],
    queryFn: async () => {
      let query = (supabase as any)
        .from("orcamentos")
        .select("id, paciente_id, data_emissao, data_validade, status, valor_total, created_at", {
          count: "exact",
        })
        .eq("paciente_id", pacienteId);

      query = applyOrcamentoFilters(query, filters)
        .order("data_emissao", { ascending: false })
        .range(pagination.from, pagination.to);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        count: count ?? 0,
        items: (data ?? []) as OrcamentoListItem[],
        page: pagination.page,
        pageSize: pagination.pageSize,
      } satisfies PaginatedResult<OrcamentoListItem>;
    },
  });
}

export function useOrcamentoById(orcamentoId: string | null | undefined) {
  return useQuery({
    ...queryPresets.detail,
    enabled: Boolean(orcamentoId),
    queryKey: ["orcamento", orcamentoId ?? null],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("orcamentos")
        .select(
          "id, paciente_id, prontuario_id, data_emissao, data_validade, status, valor_total, desconto_tipo, desconto_valor, observacoes, criado_por, created_at, updated_at, orcamento_itens(id, orcamento_id, tratamento_id, servico_id, descricao, preco_unitario, quantidade, subtotal, created_at)",
        )
        .eq("id", orcamentoId!)
        .single();

      if (error) {
        throw error;
      }

      return data as Orcamento & { orcamento_itens: OrcamentoItem[] };
    },
  });
}

export function useCriarOrcamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOrcamentoInput) => {
      const { itens, ...orcamentoData } = input;
      const { data: orcamento, error: orcamentoError } = await (supabase as any)
        .from("orcamentos")
        .insert([orcamentoData])
        .select(
          "id, paciente_id, prontuario_id, data_emissao, data_validade, status, valor_total, desconto_tipo, desconto_valor, observacoes, criado_por, created_at, updated_at",
        )
        .single();

      if (orcamentoError) {
        throw orcamentoError;
      }

      if (itens && itens.length > 0) {
        const itensComOrcamento = itens.map((item) => ({
          ...item,
          orcamento_id: orcamento.id,
        }));

        const { error: itensError } = await (supabase as any).from("orcamento_itens").insert(itensComOrcamento);

        if (itensError) {
          throw itensError;
        }
      }

      return orcamento as Orcamento;
    },
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
      const { data, error } = await (supabase as any)
        .from("orcamentos")
        .update(payload)
        .eq("id", id)
        .select(
          "id, paciente_id, prontuario_id, data_emissao, data_validade, status, valor_total, desconto_tipo, desconto_valor, observacoes, criado_por, created_at, updated_at",
        )
        .single();

      if (error) {
        throw error;
      }

      return data as Orcamento;
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
    }) => {
      const { data: orcamento, error: orcamentoError } = await (supabase as any)
        .from("orcamentos")
        .select(
          "id, paciente_id, prontuario_id, data_emissao, data_validade, status, valor_total, desconto_tipo, desconto_valor, observacoes, criado_por, created_at, updated_at, orcamento_itens(id, orcamento_id, tratamento_id, servico_id, descricao, preco_unitario, quantidade, subtotal, created_at)",
        )
        .eq("id", orcamentoId)
        .single();

      if (orcamentoError) {
        throw orcamentoError;
      }

      const { data: fatura, error: faturaError } = await (supabase as any)
        .from("faturas")
        .insert([
          {
            paciente_id: orcamento.paciente_id,
            prontuario_id: orcamento.prontuario_id,
            orcamento_id: orcamentoId,
            numero_nf: numeroNF,
            data_emissao: new Date().toISOString().split("T")[0],
            data_vencimento: dataVencimento,
            status: "emitida",
            valor_total: orcamento.valor_total,
            desconto_tipo: orcamento.desconto_tipo,
            desconto_valor: orcamento.desconto_valor,
            observacoes: orcamento.observacoes,
          },
        ])
        .select(
          "id, paciente_id, prontuario_id, orcamento_id, numero_nf, data_emissao, data_vencimento, status, valor_total, valor_pago, desconto_tipo, desconto_valor, observacoes, metodo_pagamento_default, criado_por, created_at, updated_at",
        )
        .single();

      if (faturaError) {
        throw faturaError;
      }

      if (orcamento.orcamento_itens && orcamento.orcamento_itens.length > 0) {
        const itens = orcamento.orcamento_itens.map((item: any) => ({
          descricao: item.descricao,
          fatura_id: fatura.id,
          preco_unitario: item.preco_unitario,
          quantidade: item.quantidade,
          servico_id: item.servico_id,
          tratamento_id: item.tratamento_id,
        }));

        const { error: itensError } = await (supabase as any).from("fatura_itens").insert(itens);

        if (itensError) {
          throw itensError;
        }
      }

      const { error: updateError } = await (supabase as any)
        .from("orcamentos")
        .update({ status: "convertido_em_fatura" })
        .eq("id", orcamentoId);

      if (updateError) {
        throw updateError;
      }

      return fatura as Fatura;
    },
    onSuccess: async () => {
      await invalidateFinanceiroData(queryClient);
    },
  });
}

// ============ FATURAS ============

export function useFaturasPaciente(pacienteId: string, filters?: Partial<FaturaFilters>) {
  const pagination = buildPagination(filters);

  return useQuery({
    ...queryPresets.operational,
    enabled: Boolean(pacienteId),
    placeholderData: keepPreviousData,
    queryKey: ["faturas-paciente", pacienteId, { ...filters, ...pagination }],
    queryFn: async () => {
      let query = (supabase as any)
        .from("faturas")
        .select(
          "id, paciente_id, numero_nf, data_emissao, data_vencimento, status, valor_total, valor_pago",
          { count: "exact" },
        )
        .eq("paciente_id", pacienteId);

      query = applyFaturaFilters(query, filters)
        .order("data_emissao", { ascending: false })
        .range(pagination.from, pagination.to);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        count: count ?? 0,
        items: (data ?? []) as FaturaListItem[],
        page: pagination.page,
        pageSize: pagination.pageSize,
      } satisfies PaginatedResult<FaturaListItem>;
    },
  });
}

export function useFaturas(filters?: Partial<FaturaFilters>) {
  const pagination = buildPagination(filters);

  return useQuery({
    ...queryPresets.operational,
    placeholderData: keepPreviousData,
    queryKey: ["faturas", { ...filters, ...pagination }],
    queryFn: async () => {
      let query = (supabase as any)
        .from("faturas")
        .select("id, paciente_id, numero_nf, data_emissao, data_vencimento, status, valor_total, valor_pago", {
          count: "exact",
        });

      query = applyFaturaFilters(query, filters)
        .order("data_emissao", { ascending: false })
        .range(pagination.from, pagination.to);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        count: count ?? 0,
        items: (data ?? []) as FaturaListItem[],
        page: pagination.page,
        pageSize: pagination.pageSize,
      } satisfies PaginatedResult<FaturaListItem>;
    },
  });
}

export function useFaturaById(faturaId: string | null | undefined) {
  return useQuery({
    ...queryPresets.detail,
    enabled: Boolean(faturaId),
    queryKey: ["fatura", faturaId ?? null],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("faturas")
        .select(
          "id, paciente_id, prontuario_id, orcamento_id, numero_nf, data_emissao, data_vencimento, status, valor_total, valor_pago, desconto_tipo, desconto_valor, observacoes, metodo_pagamento_default, criado_por, created_at, updated_at, fatura_itens(id, fatura_id, tratamento_id, servico_id, descricao, preco_unitario, quantidade, subtotal, created_at), pagamentos(id, fatura_id, valor, data_pagamento, metodo_pagamento, referencia, notas, registrado_por, created_at)",
        )
        .eq("id", faturaId!)
        .single();

      if (error) {
        throw error;
      }

      return data as Fatura & { fatura_itens: FaturaItem[]; pagamentos: Pagamento[] };
    },
  });
}

export function useCriarFatura() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFaturaInput) => {
      const { itens, ...faturaData } = input;
      const { data: fatura, error: faturaError } = await (supabase as any)
        .from("faturas")
        .insert([faturaData])
        .select(
          "id, paciente_id, prontuario_id, orcamento_id, numero_nf, data_emissao, data_vencimento, status, valor_total, valor_pago, desconto_tipo, desconto_valor, observacoes, metodo_pagamento_default, criado_por, created_at, updated_at",
        )
        .single();

      if (faturaError) {
        throw faturaError;
      }

      if (itens && itens.length > 0) {
        const itensComFatura = itens.map((item) => ({
          ...item,
          fatura_id: fatura.id,
        }));

        const { error: itensError } = await (supabase as any).from("fatura_itens").insert(itensComFatura);

        if (itensError) {
          throw itensError;
        }
      }

      return fatura as Fatura;
    },
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
      const { data, error } = await (supabase as any)
        .from("faturas")
        .update(payload)
        .eq("id", id)
        .select(
          "id, paciente_id, prontuario_id, orcamento_id, numero_nf, data_emissao, data_vencimento, status, valor_total, valor_pago, desconto_tipo, desconto_valor, observacoes, metodo_pagamento_default, criado_por, created_at, updated_at",
        )
        .single();

      if (error) {
        throw error;
      }

      return data as Fatura;
    },
    onSuccess: async () => {
      await invalidateFinanceiroData(queryClient);
    },
  });
}

// ============ PAGAMENTOS ============

export function useRegistrarPagamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePagamentoInput) => {
      const { fatura_id, ...pagamentoData } = input;

      const { data: pagamento, error: pagamentoError } = await (supabase as any)
        .from("pagamentos")
        .insert([{ ...pagamentoData, fatura_id }])
        .select("id, fatura_id, valor, data_pagamento, metodo_pagamento, referencia, notas, registrado_por, created_at")
        .single();

      if (pagamentoError) {
        throw pagamentoError;
      }

      const { data: fatura, error: faturaError } = await (supabase as any)
        .from("faturas")
        .select("id, paciente_id, valor_total")
        .eq("id", fatura_id)
        .single();

      if (faturaError) {
        throw faturaError;
      }

      const { data: pagamentos, error: pagamentosError } = await (supabase as any)
        .from("pagamentos")
        .select("valor")
        .eq("fatura_id", fatura_id);

      if (pagamentosError) {
        throw pagamentosError;
      }

      const valorPago = (pagamentos ?? []).reduce((sum: number, item: { valor: number }) => sum + item.valor, 0);
      const novoStatus = valorPago >= (fatura.valor_total || 0) ? "paga" : "parcialmente_paga";

      const { error: updateError } = await (supabase as any)
        .from("faturas")
        .update({ status: novoStatus, valor_pago: valorPago })
        .eq("id", fatura_id);

      if (updateError) {
        throw updateError;
      }

      return { fatura_id, paciente_id: fatura.paciente_id, pagamento };
    },
    onSuccess: async (data) => {
      await invalidateFinanceiroData(queryClient);
      await queryClient.invalidateQueries({ queryKey: ["fatura", data.fatura_id] });
    },
  });
}

// ============ CUPONS ============

export function useCupons() {
  return useQuery({
    ...queryPresets.static,
    queryKey: ["cupons"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("cupons_desconto")
        .select("id, codigo, descricao, tipo, valor, validade_inicio, validade_fim, uso_maximo, uso_atual, ativo")
        .eq("ativo", true)
        .order("validade_fim", { ascending: true });

      if (error) {
        throw error;
      }

      return data as CupomDesconto[];
    },
  });
}

export function useCriarCupom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCupomInput) => {
      const { data, error } = await (supabase as any)
        .from("cupons_desconto")
        .insert([input])
        .select("id, codigo, descricao, tipo, valor, validade_inicio, validade_fim, uso_maximo, uso_atual, ativo")
        .single();

      if (error) {
        throw error;
      }

      return data as CupomDesconto;
    },
    onSuccess: async () => {
      await invalidateFinanceiroData(queryClient);
    },
  });
}

export function useValidarCupom() {
  return useMutation({
    mutationFn: async (codigoCupom: string) => {
      const hoje = new Date().toISOString().split("T")[0];

      const { data: cupom, error } = await (supabase as any)
        .from("cupons_desconto")
        .select("id, codigo, descricao, tipo, valor, validade_inicio, validade_fim, uso_maximo, uso_atual, ativo")
        .eq("codigo", codigoCupom)
        .eq("ativo", true)
        .or(`validade_fim.is.null,validade_fim.gte.${hoje}`)
        .maybeSingle();

      if (error || !cupom) {
        throw new Error("Cupom invalido ou expirado");
      }

      if (cupom.uso_maximo && cupom.uso_atual >= cupom.uso_maximo) {
        throw new Error("Cupom atingiu o limite de uso");
      }

      return cupom as CupomDesconto;
    },
  });
}

// ============ RELATORIOS ============

export function useFinanceiroResumo(filters: FinanceiroResumoFilters) {
  return useQuery({
    ...queryPresets.operational,
    enabled: Boolean(filters.dataInicio && filters.dataFim),
    queryKey: ["financeiro-resumo", filters.dataInicio, filters.dataFim, filters.pacienteId ?? null],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("rpc_financeiro_resumo", {
        p_data_fim: filters.dataFim,
        p_data_inicio: filters.dataInicio,
        p_paciente_id: filters.pacienteId ?? null,
      });

      if (error) {
        throw error;
      }

      return mapFinanceiroResumo((data?.[0] as FinanceiroResumoRow | undefined) ?? null, filters);
    },
  });
}

export function useFinanceiroDevedores(filters?: FinanceiroDevedoresFilters) {
  const limit = filters?.limit ?? 20;

  return useQuery({
    ...queryPresets.operational,
    queryKey: ["financeiro-devedores", limit, filters?.pacienteId ?? null],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("rpc_financeiro_devedores", {
        p_limit: limit,
        p_paciente_id: filters?.pacienteId ?? null,
      });

      if (error) {
        throw error;
      }

      return (data ?? []).map((row) => ({
        dias_atraso: Number(row.dias_atraso ?? 0),
        email: row.email ?? null,
        nome: row.nome ?? "Desconhecido",
        paciente_id: row.paciente_id,
        quantidade_faturas_vencidas: Number(row.quantidade_faturas_vencidas ?? 0),
        telefone: row.telefone ?? null,
        total_devido: Number(row.total_devido ?? 0),
      })) as PacienteComDebito[];
    },
  });
}

export function useRelatorioFinanceiro(dataInicio: string, dataFim: string, pacienteId?: string) {
  return useFinanceiroResumo({ dataFim, dataInicio, pacienteId });
}

export function usePacientesComDebito() {
  return useFinanceiroDevedores({ limit: 20 });
}
