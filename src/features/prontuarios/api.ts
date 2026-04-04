/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  type CreateProntuarioInput,
  type CreateTratamentoInput,
  type ProntuarioFilters,
  type ProntuarioRecord,
  type RegistrarSessaoInput,
  type TratamentoFilters,
  type TratamentoRecord,
  type UpdateProntuarioInput,
  type UpdateTratamentoInput,
  TRATAMENTO_STATUS,
} from "./types";

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

function invalidateProntuarioData(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["prontuarios"] }),
    queryClient.invalidateQueries({ queryKey: ["tratamentos"] }),
  ]);
}

export function useProntuariosPaciente(filters: ProntuarioFilters) {
  return useQuery({
    queryKey: ["prontuarios", filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from("prontuarios")
        .select(
          `
          id,
          paciente_id,
          agendamento_id,
          profissional_id,
          profissional_nome,
          data_consulta,
          queixa_principal,
          historico_doencas,
          alergias,
          medicacoes_atuais,
          exame_fisico,
          diagnostico,
          conduta,
          observacoes_gerais,
          created_at,
          updated_at
        `,
        )
        .eq("paciente_id", filters.paciente_id)
        .order("data_consulta", { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as ProntuarioRecord[];
    },
  });
}

export function useProntuarioById(prontuarioId: string | null | undefined) {
  return useQuery({
    queryKey: ["prontuario", prontuarioId],
    queryFn: async () => {
      if (!prontuarioId) {
        throw new Error("Prontuario ID is required");
      }

      const { data, error } = await (supabase as any)
        .from("prontuarios")
        .select(
          `
          id,
          paciente_id,
          agendamento_id,
          profissional_id,
          profissional_nome,
          data_consulta,
          queixa_principal,
          historico_doencas,
          alergias,
          medicacoes_atuais,
          exame_fisico,
          diagnostico,
          conduta,
          observacoes_gerais,
          created_at,
          updated_at
        `,
        )
        .eq("id", prontuarioId)
        .single();

      if (error) {
        throw error;
      }

      return data as ProntuarioRecord;
    },
    enabled: !!prontuarioId,
  });
}

export function useTratamentosAbertos(filters: TratamentoFilters) {
  return useQuery({
    queryKey: ["tratamentos-abertos", filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from("tratamentos")
        .select(
          `
          id,
          prontuario_id,
          paciente_id,
          servico_id,
          servico_nome,
          dente_numero,
          procedimento_descricao,
          status,
          data_diagnostico,
          data_orcamento,
          data_prevista,
          num_sessoes_total,
          num_sessoes_realizadas,
          notas_sessao,
          created_at,
          updated_at
        `
        )
        .in("status", ["diagnostico", "orcamento", "data", "em_andamento"])
        .order("data_diagnostico", { ascending: false });

      if (filters.paciente_id) {
        query = query.eq("paciente_id", filters.paciente_id);
      }

      if (filters.prontuario_id) {
        query = query.eq("prontuario_id", filters.prontuario_id);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as TratamentoRecord[];
    },
  });
}

export function useTratamentosPorStatus(filters: TratamentoFilters) {
  return useQuery({
    queryKey: ["tratamentos-por-status", filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from("tratamentos")
        .select(
          `
          id,
          prontuario_id,
          paciente_id,
          servico_id,
          servico_nome,
          dente_numero,
          procedimento_descricao,
          status,
          data_diagnostico,
          data_orcamento,
          data_prevista,
          num_sessoes_total,
          num_sessoes_realizadas,
          notas_sessao,
          created_at,
          updated_at
        `
        )
        .order("data_diagnostico", { ascending: false });

      if (filters.paciente_id) {
        query = query.eq("paciente_id", filters.paciente_id);
      }

      if (filters.status) {
        const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status];
        query = query.in("status", statusArray);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as TratamentoRecord[];
    },
  });
}

// ============================================================================
// CREATE MUTATIONS
// ============================================================================

export function useCreateProntuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProntuarioInput) => {
      const payload: any = {
        paciente_id: input.paciente_id,
        agendamento_id: input.agendamento_id || null,
        profissional_id: input.profissional_id || null,
        profissional_nome: input.profissional_nome || null,
        queixa_principal: input.queixa_principal || null,
        historico_doencas: input.historico_doencas || null,
        alergias: input.alergias || null,
        medicacoes_atuais: input.medicacoes_atuais || null,
        exame_fisico: input.exame_fisico || null,
        diagnostico: input.diagnostico || null,
        conduta: input.conduta || null,
        observacoes_gerais: input.observacoes_gerais || null,
      };

      const { data, error } = await (supabase as any)
        .from("prontuarios")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar prontuário:", error);
        throw new Error(
          error.message === "The Policies do not permit this action"
            ? "Você não tem permissão para criar prontuários"
            : error.message || "Erro ao criar prontuário"
        );
      }

      return data as ProntuarioRecord;
    },
    onSuccess: async () => {
      await invalidateProntuarioData(queryClient);
    },
  });
}

export function useCreateTratamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTratamentoInput) => {
      const payload: any = {
        prontuario_id: input.prontuario_id,
        paciente_id: input.paciente_id,
        servico_id: input.servico_id || null,
        servico_nome: input.servico_nome || null,
        dente_numero: input.dente_numero || null,
        procedimento_descricao: input.procedimento_descricao,
        status: (input.status || TRATAMENTO_STATUS.diagnostico),
        data_diagnostico: input.data_diagnostico || null,
        data_orcamento: input.data_orcamento || null,
        data_prevista: input.data_prevista || null,
        num_sessoes_total: input.num_sessoes_total || null,
      };

      const { data, error } = await (supabase as any)
        .from("tratamentos")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar tratamento:", error);
        throw new Error(
          error.message === "The Policies do not permit this action"
            ? "Você não tem permissão para criar tratamentos"
            : error.message || "Erro ao criar tratamento"
        );
      }

      return data as TratamentoRecord;
    },
    onSuccess: async () => {
      await invalidateProntuarioData(queryClient);
    },
  });
}

// ============================================================================
// UPDATE MUTATIONS
// ============================================================================

export function useUpdateProntuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProntuarioInput) => {
      if (!input.id) {
        throw new Error("Prontuario sem ID para atualizacao");
      }

      const payload: any = {
        agendamento_id: input.agendamento_id ?? undefined,
        profissional_id: input.profissional_id ?? undefined,
        profissional_nome: input.profissional_nome ?? undefined,
        queixa_principal: input.queixa_principal ?? undefined,
        historico_doencas: input.historico_doencas ?? undefined,
        alergias: input.alergias ?? undefined,
        medicacoes_atuais: input.medicacoes_atuais ?? undefined,
        exame_fisico: input.exame_fisico ?? undefined,
        diagnostico: input.diagnostico ?? undefined,
        conduta: input.conduta ?? undefined,
        observacoes_gerais: input.observacoes_gerais ?? undefined,
      };

      const { data, error } = await (supabase as any)
        .from("prontuarios")
        .update(payload)
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar prontuário:", error);
        throw new Error(
          error.message === "The Policies do not permit this action"
            ? "Você não tem permissão para editar este prontuário"
            : error.message || "Erro ao atualizar prontuário"
        );
      }

      return data as ProntuarioRecord;
    },
    onSuccess: async () => {
      await invalidateProntuarioData(queryClient);
    },
  });
}

export function useUpdateTratamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTratamentoInput) => {
      if (!input.id) {
        throw new Error("Tratamento sem ID para atualizacao");
      }

      const payload: any = {
        servico_id: input.servico_id ?? undefined,
        servico_nome: input.servico_nome ?? undefined,
        status: input.status ?? undefined,
        dente_numero: input.dente_numero ?? undefined,
        procedimento_descricao: input.procedimento_descricao ?? undefined,
        data_diagnostico: input.data_diagnostico ?? undefined,
        data_orcamento: input.data_orcamento ?? undefined,
        data_prevista: input.data_prevista ?? undefined,
        num_sessoes_total: input.num_sessoes_total ?? undefined,
      };

      const { data, error } = await (supabase as any)
        .from("tratamentos")
        .update(payload)
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar tratamento:", error);
        throw new Error(
          error.message === "The Policies do not permit this action"
            ? "Você não tem permissão para editar este tratamento"
            : error.message || "Erro ao atualizar tratamento"
        );
      }

      return data as TratamentoRecord;
    },
    onSuccess: async () => {
      await invalidateProntuarioData(queryClient);
    },
  });
}

// ============================================================================
// SPECIAL MUTATIONS
// ============================================================================

export function useRegistrarSessaoTratamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RegistrarSessaoInput) => {
      if (!input.tratamento_id) {
        throw new Error("Tratamento sem ID");
      }

      // Get current tratamento to increment session count
      const { data: tratamentoAtual, error: fetchError } = await (supabase as any)
        .from("tratamentos")
        .select("num_sessoes_realizadas, notas_sessao")
        .eq("id", input.tratamento_id)
        .single();

      if (fetchError) {
        console.error("Erro ao buscar tratamento:", fetchError);
        throw fetchError;
      }

      const proximaSessao = (tratamentoAtual?.num_sessoes_realizadas ?? 0) + 1;

      const payload: any = {
        num_sessoes_realizadas: proximaSessao,
        notas_sessao: input.notas_sessao || tratamentoAtual?.notas_sessao,
      };

      const { data, error } = await (supabase as any)
        .from("tratamentos")
        .update(payload)
        .eq("id", input.tratamento_id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao registrar sessão:", error);
        throw new Error(
          error.message === "The Policies do not permit this action"
            ? "Você não tem permissão para registrar sessões"
            : error.message || "Erro ao registrar sessão"
        );
      }

      return data as TratamentoRecord;
    },
    onSuccess: async () => {
      await invalidateProntuarioData(queryClient);
    },
  });
}

// ============================================================================
// DELETE MUTATIONS (Soft delete by status)
// ============================================================================

export function useCancelaTratamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tratamentoId: string) => {
      if (!tratamentoId) {
        throw new Error("Tratamento sem ID");
      }

      const payload: any = {
        status: TRATAMENTO_STATUS.cancelado,
      };

      const { data, error } = await (supabase as any)
        .from("tratamentos")
        .update(payload)
        .eq("id", tratamentoId)
        .select()
        .single();

      if (error) {
        console.error("Erro ao cancelar tratamento:", error);
        throw new Error(
          error.message === "The Policies do not permit this action"
            ? "Você não tem permissão para cancelar tratamentos"
            : error.message || "Erro ao cancelar tratamento"
        );
      }

      return data as TratamentoRecord;
    },
    onSuccess: async () => {
      await invalidateProntuarioData(queryClient);
    },
  });
}
