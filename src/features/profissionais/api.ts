import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
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
      const from = (filters.page - 1) * filters.pageSize;
      const to = from + filters.pageSize - 1;

      let query = supabase
        .from("profissionais")
        .select("id, nome, especialidade, cro, email, telefone, ativo", { count: "exact" })
        .order("ativo", { ascending: false })
        .order("nome", { ascending: true })
        .range(from, to);

      if (filters.status === "active") {
        query = query.eq("ativo", true);
      }

      if (filters.status === "inactive") {
        query = query.eq("ativo", false);
      }

      const safeSearch = filters.search.trim().replace(/,/g, " ").replace(/\s+/g, " ");

      if (safeSearch) {
        query = query.or(
          `nome.ilike.%${safeSearch}%,especialidade.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%,telefone.ilike.%${safeSearch}%,cro.ilike.%${safeSearch}%`,
        );
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        count: count ?? 0,
        items: (data ?? []) as ProfissionalListItem[],
        page: filters.page,
        pageSize: filters.pageSize,
      } satisfies PaginatedResult<ProfissionalListItem>;
    },
  });
}

export function useProfissionalById(profissionalId: string | null | undefined) {
  return useQuery({
    ...queryPresets.detail,
    enabled: Boolean(profissionalId),
    queryKey: ["profissional", profissionalId ?? null],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profissionais")
        .select("id, nome, especialidade, cro, email, telefone, ativo, created_at, updated_at")
        .eq("id", profissionalId!)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return (data ?? null) as ProfissionalRecord | null;
    },
  });
}

export function useCreateProfissional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveProfissionalInput) => {
      const payload: TablesInsert<"profissionais"> = {
        ativo: input.ativo,
        cro: input.cro,
        email: input.email,
        especialidade: input.especialidade,
        nome: input.nome,
        telefone: input.telefone,
      };

      const { data, error } = await supabase
        .from("profissionais")
        .insert(payload)
        .select("id, nome, especialidade, cro, email, telefone, ativo, created_at, updated_at")
        .single();

      if (error) {
        throw error;
      }

      return data as ProfissionalRecord;
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

      const payload: TablesUpdate<"profissionais"> = {
        ativo: input.ativo,
        cro: input.cro,
        email: input.email,
        especialidade: input.especialidade,
        nome: input.nome,
        telefone: input.telefone,
      };

      const { data, error } = await supabase
        .from("profissionais")
        .update(payload)
        .eq("id", input.id)
        .select("id, nome, especialidade, cro, email, telefone, ativo, created_at, updated_at")
        .single();

      if (error) {
        throw error;
      }

      return data as ProfissionalRecord;
    },
    onSuccess: async () => {
      await invalidateProfissionalData(queryClient);
    },
  });
}
