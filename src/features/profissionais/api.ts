import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";
import { clinicApi } from "@/features/integrations/dental-api";
import { queryPresets } from "@/lib/react-query";
import type { PaginatedResult } from "@/types/api";

export type ProfissionalRecord = Tables<"profissionais">;
export type ProfissionalStatusFilter = "all" | "active" | "inactive";
export type ProfissionalListItem = Pick<
  Tables<"profissionais">,
  "ativo" | "cro" | "email" | "especialidade" | "id" | "nome" | "telefone"
>;

export type ProfissionaisListFilters = {
  page: number;
  pageSize: number;
  search: string;
  status: ProfissionalStatusFilter;
};

export type SaveProfissionalInput = {
  ativo: boolean;
  cro: string | null;
  email: string | null;
  especialidade: string | null;
  id?: string;
  nome: string;
  telefone: string | null;
};

function invalidateProfissionalData(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["profissionais-list"] }),
    queryClient.invalidateQueries({ queryKey: ["profissional"] }),
    queryClient.invalidateQueries({ queryKey: ["profissionais-options"] }),
    queryClient.invalidateQueries({ queryKey: ["overview"] }),
  ]);
}

export function useProfissionaisListQuery(filters: ProfissionaisListFilters) {
  return useQuery({
    ...queryPresets.search,
    placeholderData: keepPreviousData,
    queryKey: ["profissionais-list", filters],
    queryFn: async () => {
      return clinicApi.professionals.list<ProfissionalListItem>({
        page: filters.page,
        pageSize: filters.pageSize,
        search: filters.search,
        status: filters.status,
      }) as Promise<PaginatedResult<ProfissionalListItem>>;
    },
  });
}

export function useProfissionalById(profissionalId: string | null | undefined) {
  return useQuery({
    ...queryPresets.detail,
    enabled: Boolean(profissionalId),
    queryKey: ["profissional", profissionalId ?? null],
    queryFn: async () => {
      return clinicApi.professionals.byId<ProfissionalRecord>(profissionalId!);
    },
  });
}

export function useCreateProfissional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveProfissionalInput) => {
      const payload = {
        ativo: input.ativo,
        cro: input.cro,
        email: input.email,
        especialidade: input.especialidade,
        nome: input.nome,
        telefone: input.telefone,
      };

      return clinicApi.professionals.create<ProfissionalRecord>(payload);
    },
    onSuccess: async () => {
      await invalidateProfissionalData(queryClient);
    },
  });
}

export function useUpdateProfissional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveProfissionalInput) => {
      if (!input.id) {
        throw new Error("Profissional sem ID para atualizacao.");
      }

      const payload = {
        ativo: input.ativo,
        cro: input.cro,
        email: input.email,
        especialidade: input.especialidade,
        nome: input.nome,
        telefone: input.telefone,
      };

      return clinicApi.professionals.update<ProfissionalRecord>(input.id, payload);
    },
    onSuccess: async () => {
      await invalidateProfissionalData(queryClient);
    },
  });
}
