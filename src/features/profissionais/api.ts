import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type ProfissionalRecord = Tables<"profissionais">;
export type ProfissionalStatusFilter = "all" | "active" | "inactive";

export type ProfissionaisFilters = {
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
    queryClient.invalidateQueries({ queryKey: ["profissionais-admin"] }),
    queryClient.invalidateQueries({ queryKey: ["profissionais-options"] }),
    queryClient.invalidateQueries({ queryKey: ["overview"] }),
  ]);
}

export function useProfissionaisAdminQuery(filters: ProfissionaisFilters) {
  return useQuery({
    queryKey: ["profissionais-admin", filters],
    queryFn: async () => {
      let query = supabase
        .from("profissionais")
        .select("id, nome, especialidade, cro, email, telefone, ativo, created_at, updated_at")
        .order("ativo", { ascending: false })
        .order("nome", { ascending: true });

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

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data ?? []) as ProfissionalRecord[];
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
