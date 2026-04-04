/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  type CreateServicoInput,
  type UpdateServicoInput,
  type Servico,
  type CreateOrcamentoInput,
  type UpdateOrcamentoInput,
  type Orcamento,
  type OrcamentoFilters,
  type CreateFaturaInput,
  type UpdateFaturaInput,
  type Fatura,
  type FaturaFilters,
  type CreatePagamentoInput,
  type Pagamento,
  type CreateCupomInput,
  type UpdateCupomInput,
  type CupomDesconto,
  type RelatorioFinanceiro,
  type PacienteComDebito,
} from "./types";

// ============ SERVIÇOS ============

export function useServiços() {
  return useQuery({
    queryKey: ["servicos"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("servicos")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
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
        .select()
        .single();

      if (error) throw error;
      return data as Servico;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
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
        .select()
        .single();

      if (error) throw error;
      return data as Servico;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
    },
  });
}

// ============ PACIENTES (para Orçamentos) ============

export interface PacienteComCPF {
  id: string;
  nome: string;
  cpf?: string;
  email?: string;
  telefone?: string;
}

export function useBuscarPacientes(termoBusca: string) {
  return useQuery({
    queryKey: ["pacientes-busca", termoBusca],
    queryFn: async () => {
      if (!termoBusca || termoBusca.length < 2) {
        return [];
      }

      const { data, error } = await (supabase as any)
        .from("pacientes")
        .select("id, nome, cpf, email, telefone")
        .ilike("nome", `%${termoBusca}%`)
        .order("nome")
        .limit(10);

      if (error) throw error;
      return data as PacienteComCPF[];
    },
    enabled: termoBusca.length >= 2,
  });
}

// ============ ORÇAMENTOS ============

export function useOrcamentosPaciente(pacienteId: string, filters?: Partial<OrcamentoFilters>) {
  return useQuery({
    queryKey: ["orcamentos-paciente", pacienteId, filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from("orcamentos")
        .select("*")
        .eq("paciente_id", pacienteId);

      if (filters?.status) {
        const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status];
        query = query.in("status", statusArray);
      }

      if (filters?.data_inicio) {
        query = query.gte("data_emissao", filters.data_inicio);
      }

      if (filters?.data_fim) {
        query = query.lte("data_emissao", filters.data_fim);
      }

      query = query.order("data_emissao", { ascending: false });

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.offset(filters.offset);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Orcamento[];
    },
    enabled: !!pacienteId,
  });
}

export function useOrcamentoById(orcamentoId: string | null | undefined) {
  return useQuery({
    queryKey: ["orcamento", orcamentoId],
    queryFn: async () => {
      if (!orcamentoId) throw new Error("Orcamento ID required");

      const { data, error } = await (supabase as any)
        .from("orcamentos")
        .select("*, orcamento_itens(*)")
        .eq("id", orcamentoId)
        .single();

      if (error) throw error;
      return data as Orcamento & { orcamento_itens: any[] };
    },
    enabled: !!orcamentoId,
  });
}

export function useCriarOrcamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOrcamentoInput) => {
      const { itens, ...orcamentoData } = input;

      // 1. Criar orçamento
      const { data: orcamento, error: orcamentoError } = await (supabase as any)
        .from("orcamentos")
        .insert([orcamentoData])
        .select()
        .single();

      if (orcamentoError) throw orcamentoError;

      // 2. Inserir itens se fornecidos
      if (itens && itens.length > 0) {
        const itensComOrcamento = itens.map((item) => ({
          ...item,
          orcamento_id: orcamento.id,
        }));

        const { error: itensError } = await (supabase as any)
          .from("orcamento_itens")
          .insert(itensComOrcamento);

        if (itensError) throw itensError;
      }

      return orcamento as Orcamento;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orcamentos-paciente", data.paciente_id] });
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
        .select()
        .single();

      if (error) throw error;
      return data as Orcamento;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orcamento", data.id] });
      queryClient.invalidateQueries({ queryKey: ["orcamentos-paciente", data.paciente_id] });
    },
  });
}

export function useConverterOrcamentoEmFatura() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orcamentoId,
      numeroNF,
      dataVencimento,
    }: {
      orcamentoId: string;
      numeroNF?: string;
      dataVencimento?: string;
    }) => {
      // 1. Buscar orçamento com seus itens
      const { data: orcamento, error: orcamentoError } = await (supabase as any)
        .from("orcamentos")
        .select("*, orcamento_itens(*)")
        .eq("id", orcamentoId)
        .single();

      if (orcamentoError) throw orcamentoError;

      // 2. Criar fatura a partir do orçamento
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
        .select()
        .single();

      if (faturaError) throw faturaError;

      // 3. Inserir itens da fatura
      if (orcamento.orcamento_itens && orcamento.orcamento_itens.length > 0) {
        const itens = orcamento.orcamento_itens.map((item: any) => ({
          fatura_id: fatura.id,
          tratamento_id: item.tratamento_id,
          servico_id: item.servico_id,
          descricao: item.descricao,
          preco_unitario: item.preco_unitario,
          quantidade: item.quantidade,
        }));

        const { error: itensError } = await (supabase as any)
          .from("fatura_itens")
          .insert(itens);

        if (itensError) throw itensError;
      }

      // 4. Atualizar status do orçamento
      await (supabase as any)
        .from("orcamentos")
        .update({ status: "convertido_em_fatura" })
        .eq("id", orcamentoId);

      return fatura as Fatura;
    },
    onSuccess: (fatura) => {
      queryClient.invalidateQueries({ queryKey: ["orcamentos-paciente", fatura.paciente_id] });
      queryClient.invalidateQueries({ queryKey: ["faturas-paciente", fatura.paciente_id] });
    },
  });
}

// ============ FATURAS ============

export function useFaturasPaciente(pacienteId: string, filters?: Partial<FaturaFilters>) {
  return useQuery({
    queryKey: ["faturas-paciente", pacienteId, filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from("faturas")
        .select("*")
        .eq("paciente_id", pacienteId);

      if (filters?.status) {
        const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status];
        query = query.in("status", statusArray);
      }

      if (filters?.data_inicio) {
        query = query.gte("data_emissao", filters.data_inicio);
      }

      if (filters?.data_fim) {
        query = query.lte("data_emissao", filters.data_fim);
      }

      if (filters?.apenas_vencidas) {
        const hoje = new Date().toISOString().split("T")[0];
        query = query.lt("data_vencimento", hoje);
      }

      query = query.order("data_emissao", { ascending: false });

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.offset(filters.offset);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Fatura[];
    },
    enabled: !!pacienteId,
  });
}

export function useFaturas(filters?: Partial<FaturaFilters>) {
  return useQuery({
    queryKey: ["faturas", filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from("faturas")
        .select("*");

      if (filters?.status) {
        const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status];
        query = query.in("status", statusArray);
      }

      if (filters?.data_inicio) {
        query = query.gte("data_emissao", filters.data_inicio);
      }

      if (filters?.data_fim) {
        query = query.lte("data_emissao", filters.data_fim);
      }

      if (filters?.apenas_vencidas) {
        const hoje = new Date().toISOString().split("T")[0];
        query = query.lt("data_vencimento", hoje);
      }

      query = query.order("data_emissao", { ascending: false });

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.offset(filters.offset);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Fatura[];
    },
  });
}

export function useFaturaById(faturaId: string | null | undefined) {
  return useQuery({
    queryKey: ["fatura", faturaId],
    queryFn: async () => {
      if (!faturaId) throw new Error("Fatura ID required");

      const { data, error } = await (supabase as any)
        .from("faturas")
        .select("*, fatura_itens(*), pagamentos(*)")
        .eq("id", faturaId)
        .single();

      if (error) throw error;
      return data as Fatura & { fatura_itens: any[]; pagamentos: Pagamento[] };
    },
    enabled: !!faturaId,
  });
}

export function useCriarFatura() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFaturaInput) => {
      const { itens, ...faturaData } = input;

      // 1. Criar fatura
      const { data: fatura, error: faturaError } = await (supabase as any)
        .from("faturas")
        .insert([faturaData])
        .select()
        .single();

      if (faturaError) throw faturaError;

      // 2. Inserir itens se fornecidos
      if (itens && itens.length > 0) {
        const itensComFatura = itens.map((item) => ({
          ...item,
          fatura_id: fatura.id,
        }));

        const { error: itensError } = await (supabase as any)
          .from("fatura_itens")
          .insert(itensComFatura);

        if (itensError) throw itensError;
      }

      return fatura as Fatura;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["faturas-paciente", data.paciente_id] });
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
        .select()
        .single();

      if (error) throw error;
      return data as Fatura;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["fatura", data.id] });
      queryClient.invalidateQueries({ queryKey: ["faturas-paciente", data.paciente_id] });
    },
  });
}

// ============ PAGAMENTOS ============

export function useRegistrarPagamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePagamentoInput) => {
      const { fatura_id, ...pagamentoData } = input;

      // 1. Registrar pagamento
      const { data: pagamento, error: pagamentoError } = await (supabase as any)
        .from("pagamentos")
        .insert([{ ...pagamentoData, fatura_id }])
        .select()
        .single();

      if (pagamentoError) throw pagamentoError;

      // 2. Buscar fatura para recalcular valor_pago
      const { data: fatura, error: faturaError } = await (supabase as any)
        .from("faturas")
        .select("id, paciente_id")
        .eq("id", fatura_id)
        .single();

      if (faturaError) throw faturaError;

      // 3. Buscar todos os pagamentos da fatura
      const { data: pagamentos, error: pagamentosError } = await (supabase as any)
        .from("pagamentos")
        .select("valor")
        .eq("fatura_id", fatura_id);

      if (pagamentosError) throw pagamentosError;

      const valor_pago = pagamentos.reduce((sum: number, p: any) => sum + p.valor, 0);

      // 4. Atualizar status e valor_pago da fatura
      const novoStatus =
        valor_pago >= (fatura.valor_total || 0) ? "paga" : "parcialmente_paga";

      await (supabase as any)
        .from("faturas")
        .update({ valor_pago, status: novoStatus })
        .eq("id", fatura_id);

      return { pagamento, fatura_id, paciente_id: fatura.paciente_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["fatura", data.fatura_id] });
      queryClient.invalidateQueries({ queryKey: ["faturas-paciente", data.paciente_id] });
      queryClient.invalidateQueries({ queryKey: ["relatorio-financeiro"] });
    },
  });
}

// ============ CUPONS ============

export function useCupons() {
  return useQuery({
    queryKey: ["cupons"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("cupons_desconto")
        .select("*")
        .eq("ativo", true)
        .order("validade_fim", { ascending: true });

      if (error) throw error;
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
        .select()
        .single();

      if (error) throw error;
      return data as CupomDesconto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cupons"] });
    },
  });
}

export function useValidarCupom() {
  return useMutation({
    mutationFn: async (codigoCupom: string) => {
      const hoje = new Date().toISOString().split("T")[0];

      const { data: cupom, error } = await (supabase as any)
        .from("cupons_desconto")
        .select("*")
        .eq("codigo", codigoCupom)
        .eq("ativo", true)
        .gte("validade_fim", hoje)
        .single();

      if (error) {
        throw new Error("Cupom inválido ou expirado");
      }

      // Verificar limite de uso
      if (cupom.uso_maximo && cupom.uso_atual >= cupom.uso_maximo) {
        throw new Error("Cupom atingiu o limite de uso");
      }

      return cupom as CupomDesconto;
    },
  });
}

// ============ RELATÓRIOS ============

export function useRelatorioFinanceiro(
  dataInicio: string,
  dataFim: string,
  pacienteId?: string
) {
  return useQuery({
    queryKey: ["relatorio-financeiro", dataInicio, dataFim, pacienteId],
    queryFn: async () => {
      let queryFaturas = (supabase as any)
        .from("faturas")
        .select("valor_total, valor_pago, status, desconto_valor");

      let queryPagamentos = (supabase as any)
        .from("pagamentos")
        .select("valor, data_pagamento");

      if (pacienteId) {
        queryFaturas = queryFaturas.eq("paciente_id", pacienteId);
        queryPagamentos = queryPagamentos.in(
          "fatura_id",
          (supabase as any).from("faturas").select("id").eq("paciente_id", pacienteId)
        );
      }

      queryFaturas = queryFaturas
        .gte("data_emissao", dataInicio)
        .lte("data_emissao", dataFim);

      const { data: faturas, error: fatError } = await queryFaturas;
      if (fatError) throw fatError;

      const { data: pagamentos, error: pagError } = await queryPagamentos;
      if (pagError) throw pagError;

      const totalFaturado = faturas.reduce((sum: number, f: any) => sum + f.valor_total, 0);
      const totalRecebido = pagamentos.reduce((sum: number, p: any) => sum + p.valor, 0);
      const totalDesconto = faturas.reduce((sum: number, f: any) => sum + (f.desconto_valor || 0), 0);
      const faturasPagas = faturas.filter((f: any) => f.status === "paga").length;

      const relatorio: RelatorioFinanceiro = {
        periodo: { inicio: dataInicio, fim: dataFim },
        total_faturado: totalFaturado,
        total_recebido: totalRecebido,
        total_pendente: totalFaturado - totalRecebido,
        total_vencido: 0, // Será calculado com data_vencimento
        total_desconto_aplicado: totalDesconto,
        quantidade_faturas: faturas.length,
        quantidade_faturas_pagas: faturasPagas,
        quantidade_faturas_pendentes: faturas.length - faturasPagas,
        taxa_recebimento: totalFaturado > 0 ? (totalRecebido / totalFaturado) * 100 : 0,
      };

      return relatorio;
    },
  });
}

export function usePacientesComDebito() {
  return useQuery({
    queryKey: ["pacientes-com-debito"],
    queryFn: async () => {
      const hoje = new Date().toISOString().split("T")[0];

      const { data: faturas, error } = await (supabase as any)
        .from("faturas")
        .select(
          `
          id,
          paciente_id,
          pacientes(id, nome, email, telefone),
          valor_total,
          valor_pago,
          data_vencimento,
          status
        `
        )
        .in("status", ["emitida", "parcialmente_paga"])
        .order("data_vencimento");

      if (error) throw error;

      // Agrupar por paciente e calcular débito total
      const pacientesDebito: { [key: string]: PacienteComDebito } = {};

      faturas.forEach((fatura: any) => {
        const pacienteId = fatura.paciente_id;
        const devidoFatura = fatura.valor_total - fatura.valor_pago;

        if (!pacientesDebito[pacienteId]) {
          pacientesDebito[pacienteId] = {
            paciente_id: pacienteId,
            nome: fatura.pacientes?.nome || "Desconhecido",
            email: fatura.pacientes?.email,
            telefone: fatura.pacientes?.telefone,
            total_devido: 0,
            dias_atraso: 0,
            quantidade_faturas_vencidas: 0,
          };
        }

        pacientesDebito[pacienteId].total_devido += devidoFatura;

        if (fatura.data_vencimento && fatura.data_vencimento < hoje) {
          const diaAtraso = Math.floor(
            (new Date(hoje).getTime() - new Date(fatura.data_vencimento).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          pacientesDebito[pacienteId].dias_atraso = Math.max(
            pacientesDebito[pacienteId].dias_atraso,
            diaAtraso
          );
          pacientesDebito[pacienteId].quantidade_faturas_vencidas += 1;
        }
      });

      return Object.values(pacientesDebito).sort((a, b) => b.total_devido - a.total_devido);
    },
  });
}
