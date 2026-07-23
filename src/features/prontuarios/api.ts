import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clinicApi } from "@/features/integrations/dental-api";
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
} from "./types";

function invalidateProntuarioData(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["prontuarios"] }),
    queryClient.invalidateQueries({ queryKey: ["prontuario"] }),
    queryClient.invalidateQueries({ queryKey: ["tratamentos"] }),
    queryClient.invalidateQueries({ queryKey: ["tratamentos-abertos"] }),
    queryClient.invalidateQueries({ queryKey: ["tratamentos-por-status"] }),
  ]);
}

export function useProntuariosPaciente(filters: ProntuarioFilters) {
  return useQuery({
    enabled: Boolean(filters.paciente_id),
    queryKey: ["prontuarios", filters],
    queryFn: async () =>
      clinicApi.records.byPatient<ProntuarioRecord>(filters.paciente_id, {
        limit: filters.limit,
        offset: filters.offset,
      }),
  });
}

export function useProntuarioById(prontuarioId: string | null | undefined) {
  return useQuery({
    enabled: Boolean(prontuarioId),
    queryKey: ["prontuario", prontuarioId],
    queryFn: async () => {
      if (!prontuarioId) {
        throw new Error("Prontuario ID is required");
      }

      return clinicApi.records.byId<ProntuarioRecord>(prontuarioId);
    },
  });
}

export function useTratamentosAbertos(filters: TratamentoFilters) {
  return useQuery({
    queryKey: ["tratamentos-abertos", filters],
    queryFn: async () =>
      clinicApi.records.treatments<TratamentoRecord>({
        ...filters,
        onlyOpen: true,
      }),
  });
}

export function useTratamentosPorStatus(filters: TratamentoFilters) {
  return useQuery({
    queryKey: ["tratamentos-por-status", filters],
    queryFn: async () => clinicApi.records.treatments<TratamentoRecord>(filters),
  });
}

export function useCreateProntuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProntuarioInput) =>
      clinicApi.records.create<ProntuarioRecord>({
        agendamento_id: input.agendamento_id || null,
        alergias: input.alergias || null,
        conduta: input.conduta || null,
        diagnostico: input.diagnostico || null,
        exame_fisico: input.exame_fisico || null,
        historico_doencas: input.historico_doencas || null,
        medicacoes_atuais: input.medicacoes_atuais || null,
        observacoes_gerais: input.observacoes_gerais || null,
        paciente_id: input.paciente_id,
        profissional_id: input.profissional_id || null,
        profissional_nome: input.profissional_nome || null,
        queixa_principal: input.queixa_principal || null,
      }),
    onSuccess: async () => {
      await invalidateProntuarioData(queryClient);
    },
  });
}

export function useCreateTratamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTratamentoInput) =>
      clinicApi.records.createTreatment<TratamentoRecord>({
        data_diagnostico: input.data_diagnostico || null,
        data_orcamento: input.data_orcamento || null,
        data_prevista: input.data_prevista || null,
        dente_numero: input.dente_numero || null,
        num_sessoes_total: input.num_sessoes_total || null,
        paciente_id: input.paciente_id,
        procedimento_descricao: input.procedimento_descricao,
        prontuario_id: input.prontuario_id,
        servico_id: input.servico_id || null,
        servico_nome: input.servico_nome || null,
        status: input.status || "diagnostico",
      }),
    onSuccess: async () => {
      await invalidateProntuarioData(queryClient);
    },
  });
}

export function useUpdateProntuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProntuarioInput) => {
      if (!input.id) {
        throw new Error("Prontuario sem ID para atualizacao");
      }

      const { id, paciente_id: _pacienteId, ...payload } = input;
      return clinicApi.records.update<ProntuarioRecord>(id, payload as Record<string, unknown>);
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

      const { id, ...payload } = input;
      return clinicApi.records.updateTreatment<TratamentoRecord>(id, payload as Record<string, unknown>);
    },
    onSuccess: async () => {
      await invalidateProntuarioData(queryClient);
    },
  });
}

export function useRegistrarSessaoTratamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RegistrarSessaoInput) => {
      if (!input.tratamento_id) {
        throw new Error("Tratamento sem ID");
      }

      return clinicApi.records.registerTreatmentSession<TratamentoRecord>(input.tratamento_id, {
        notas_sessao: input.notas_sessao || null,
      });
    },
    onSuccess: async () => {
      await invalidateProntuarioData(queryClient);
    },
  });
}

export function useCancelaTratamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tratamentoId: string) => {
      if (!tratamentoId) {
        throw new Error("Tratamento sem ID");
      }

      return clinicApi.records.cancelTreatment<TratamentoRecord>(tratamentoId);
    },
    onSuccess: async () => {
      await invalidateProntuarioData(queryClient);
    },
  });
}
