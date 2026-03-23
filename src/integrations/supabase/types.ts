export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      caixa_movimentacoes: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          origem: string | null
          tipo: string
          valor: number
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          origem?: string | null
          tipo: string
          valor: number
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          origem?: string | null
          tipo?: string
          valor?: number
        }
        Relationships: []
      }
      categorias: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          nome: string
          ordem: number | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
          ordem?: number | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
          ordem?: number | null
        }
        Relationships: []
      }
      estoque_movimentacoes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          marmita_id: string
          motivo: string | null
          pedido_id: string | null
          quantidade: number
          tipo: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          marmita_id: string
          motivo?: string | null
          pedido_id?: string | null
          quantidade: number
          tipo: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          marmita_id?: string
          motivo?: string | null
          pedido_id?: string | null
          quantidade?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_movimentacoes_marmita_id_fkey"
            columns: ["marmita_id"]
            isOneToOne: false
            referencedRelation: "marmitas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      imoveis: {
        Row: {
          area_construida: number | null
          area_total: number | null
          ativo: boolean | null
          bairro: string | null
          banheiros: number | null
          caracteristicas: string[] | null
          cep: string | null
          cidade: string
          created_at: string | null
          descricao: string | null
          destaque: boolean | null
          endereco: string
          estado: string
          finalidade: Database["public"]["Enums"]["finalidade_imovel"]
          google_maps_url: string | null
          id: string
          imagem_principal: string | null
          preco: number
          preco_aluguel: number | null
          quartos: number | null
          tipo: Database["public"]["Enums"]["tipo_imovel"]
          titulo: string
          updated_at: string | null
          vagas_garagem: number | null
          vendido: boolean | null
          video_url: string | null
        }
        Insert: {
          area_construida?: number | null
          area_total?: number | null
          ativo?: boolean | null
          bairro?: string | null
          banheiros?: number | null
          caracteristicas?: string[] | null
          cep?: string | null
          cidade: string
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          endereco: string
          estado?: string
          finalidade?: Database["public"]["Enums"]["finalidade_imovel"]
          google_maps_url?: string | null
          id?: string
          imagem_principal?: string | null
          preco: number
          preco_aluguel?: number | null
          quartos?: number | null
          tipo: Database["public"]["Enums"]["tipo_imovel"]
          titulo: string
          updated_at?: string | null
          vagas_garagem?: number | null
          vendido?: boolean | null
          video_url?: string | null
        }
        Update: {
          area_construida?: number | null
          area_total?: number | null
          ativo?: boolean | null
          bairro?: string | null
          banheiros?: number | null
          caracteristicas?: string[] | null
          cep?: string | null
          cidade?: string
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          endereco?: string
          estado?: string
          finalidade?: Database["public"]["Enums"]["finalidade_imovel"]
          google_maps_url?: string | null
          id?: string
          imagem_principal?: string | null
          preco?: number
          preco_aluguel?: number | null
          quartos?: number | null
          tipo?: Database["public"]["Enums"]["tipo_imovel"]
          titulo?: string
          updated_at?: string | null
          vagas_garagem?: number | null
          vendido?: boolean | null
          video_url?: string | null
        }
        Relationships: []
      }
      imovel_contatos: {
        Row: {
          created_at: string | null
          data_contato_futuro: string | null
          email: string | null
          id: string
          imovel_id: string
          mensagem: string | null
          nome: string
          status: string | null
          telefone: string
        }
        Insert: {
          created_at?: string | null
          data_contato_futuro?: string | null
          email?: string | null
          id?: string
          imovel_id: string
          mensagem?: string | null
          nome: string
          status?: string | null
          telefone: string
        }
        Update: {
          created_at?: string | null
          data_contato_futuro?: string | null
          email?: string | null
          id?: string
          imovel_id?: string
          mensagem?: string | null
          nome?: string
          status?: string | null
          telefone?: string
        }
        Relationships: [
          {
            foreignKeyName: "imovel_contatos_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
        ]
      }
      imovel_imagens: {
        Row: {
          created_at: string | null
          id: string
          imovel_id: string
          ordem: number | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          imovel_id: string
          ordem?: number | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          imovel_id?: string
          ordem?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "imovel_imagens_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
        ]
      }
      interesse_marmita: {
        Row: {
          created_at: string | null
          id: string
          marmita_id: string | null
          marmita_nome: string | null
          nome_cliente: string
          whatsapp: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          marmita_id?: string | null
          marmita_nome?: string | null
          nome_cliente: string
          whatsapp: string
        }
        Update: {
          created_at?: string | null
          id?: string
          marmita_id?: string | null
          marmita_nome?: string | null
          nome_cliente?: string
          whatsapp?: string
        }
        Relationships: []
      }
      marmitas: {
        Row: {
          categoria_id: string | null
          created_at: string | null
          descricao: string | null
          disponivel: boolean | null
          estoque: number | null
          id: string
          imagem_url: string | null
          nome: string
          preco: number
          updated_at: string | null
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string | null
          descricao?: string | null
          disponivel?: boolean | null
          estoque?: number | null
          id?: string
          imagem_url?: string | null
          nome: string
          preco: number
          updated_at?: string | null
        }
        Update: {
          categoria_id?: string | null
          created_at?: string | null
          descricao?: string | null
          disponivel?: boolean | null
          estoque?: number | null
          id?: string
          imagem_url?: string | null
          nome?: string
          preco?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          bairro_cliente: string | null
          complemento_cliente: string | null
          created_at: string | null
          endereco_cliente: string | null
          id: string
          itens: Json
          nome_cliente: string | null
          observacoes_admin: string | null
          observacoes_cliente: string | null
          status: string | null
          telefone_cliente: string | null
          valor_total: number
        }
        Insert: {
          bairro_cliente?: string | null
          complemento_cliente?: string | null
          created_at?: string | null
          endereco_cliente?: string | null
          id?: string
          itens: Json
          nome_cliente?: string | null
          observacoes_admin?: string | null
          observacoes_cliente?: string | null
          status?: string | null
          telefone_cliente?: string | null
          valor_total: number
        }
        Update: {
          bairro_cliente?: string | null
          complemento_cliente?: string | null
          created_at?: string | null
          endereco_cliente?: string | null
          id?: string
          itens?: Json
          nome_cliente?: string | null
          observacoes_admin?: string | null
          observacoes_cliente?: string | null
          status?: string | null
          telefone_cliente?: string | null
          valor_total?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      finalidade_imovel: "venda" | "aluguel" | "venda_aluguel"
      tipo_imovel: "casa" | "apartamento" | "terreno" | "comercial" | "rural"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      finalidade_imovel: ["venda", "aluguel", "venda_aluguel"],
      tipo_imovel: ["casa", "apartamento", "terreno", "comercial", "rural"],
    },
  },
} as const
