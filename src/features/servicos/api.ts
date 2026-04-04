import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type ServicoRecord = Tables<"servicos">;
export type ServicoStatusFilter = "all" | "active" | "inactive";

export type ServicosFilters = {
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
    queryClient.invalidateQueries({ queryKey: ["servicos-admin"] }),
    queryClient.invalidateQueries({ queryKey: ["servicos-options"] }),
    queryClient.invalidateQueries({ queryKey: ["overview"] }),
  ]);
}

export function useServicosAdminQuery(filters: ServicosFilters) {
  return useQuery({
    queryKey: ["servicos-admin", filters],
    queryFn: async () => {
      let query = supabase
        .from("servicos")
        .select("id, nome, descricao, duracao_minutos, preco, ativo, created_at, updated_at")
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
        query = query.or(`nome.ilike.%${safeSearch}%,descricao.ilike.%${safeSearch}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data ?? []) as ServicoRecord[];
    },
  });
}

export function useCreateServico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveServicoInput) => {
      const payload: TablesInsert<"servicos"> = {
        ativo: input.ativo,
        descricao: input.descricao,
        duracao_minutos: input.duracao_minutos,
        nome: input.nome,
        preco: input.preco,
      };

      const { data, error } = await supabase
        .from("servicos")
        .insert(payload)
        .select("id, nome, descricao, duracao_minutos, preco, ativo, created_at, updated_at")
        .single();

      if (error) {
        throw error;
      }

      return data as ServicoRecord;
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

      const payload: TablesUpdate<"servicos"> = {
        ativo: input.ativo,
        descricao: input.descricao,
        duracao_minutos: input.duracao_minutos,
        nome: input.nome,
        preco: input.preco,
      };

      const { data, error } = await supabase
        .from("servicos")
        .update(payload)
        .eq("id", input.id)
        .select("id, nome, descricao, duracao_minutos, preco, ativo, created_at, updated_at")
        .single();

      if (error) {
        throw error;
      }

      return data as ServicoRecord;
    },
    onSuccess: async () => {
      await invalidateServicoData(queryClient);
    },
  });
}
