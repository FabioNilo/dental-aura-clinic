import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";
import { clinicApi } from "@/features/integrations/dental-api";
import { queryPresets } from "@/lib/react-query";
import type { PaginatedResult } from "@/types/api";

export type ServicoRecord = Tables<"servicos">;
export type ServicoStatusFilter = "all" | "active" | "inactive";
export type ServicoListItem = Pick<
  Tables<"servicos">,
  "ativo" | "descricao" | "duracao_minutos" | "id" | "nome" | "preco"
>;

export type ServicosListFilters = {
  page: number;
  pageSize: number;
  search: string;
  status: ServicoStatusFilter;
};

export type SaveServicoInput = {
  ativo: boolean;
  descricao: string | null;
  duracao_minutos: number | null;
  id?: string;
  nome: string;
  preco: number | null;
};

function invalidateServicoData(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["servicos-list"] }),
    queryClient.invalidateQueries({ queryKey: ["servico"] }),
    queryClient.invalidateQueries({ queryKey: ["servicos-options"] }),
    queryClient.invalidateQueries({ queryKey: ["overview"] }),
  ]);
}

export function useServicosListQuery(filters: ServicosListFilters) {
  return useQuery({
    ...queryPresets.search,
    placeholderData: keepPreviousData,
    queryKey: ["servicos-list", filters],
    queryFn: async () => {
      return clinicApi.services.list<ServicoListItem>({
        page: filters.page,
        pageSize: filters.pageSize,
        search: filters.search,
        status: filters.status,
      }) as Promise<PaginatedResult<ServicoListItem>>;
    },
  });
}

export function useServicoById(servicoId: string | null | undefined) {
  return useQuery({
    ...queryPresets.detail,
    enabled: Boolean(servicoId),
    queryKey: ["servico", servicoId ?? null],
    queryFn: async () => {
      return clinicApi.services.byId<ServicoRecord>(servicoId!);
    },
  });
}

export function useCreateServico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveServicoInput) => {
      const payload = {
        ativo: input.ativo,
        descricao: input.descricao,
        duracao_minutos: input.duracao_minutos,
        nome: input.nome,
        preco: input.preco,
      };

      return clinicApi.services.create<ServicoRecord>(payload);
    },
    onSuccess: async () => {
      await invalidateServicoData(queryClient);
    },
  });
}

export function useUpdateServico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveServicoInput) => {
      if (!input.id) {
        throw new Error("Servico sem ID para atualizacao.");
      }

      const payload = {
        ativo: input.ativo,
        descricao: input.descricao,
        duracao_minutos: input.duracao_minutos,
        nome: input.nome,
        preco: input.preco,
      };

      return clinicApi.services.update<ServicoRecord>(input.id, payload);
    },
    onSuccess: async () => {
      await invalidateServicoData(queryClient);
    },
  });
}
