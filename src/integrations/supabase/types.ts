export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      agendamentos: {
        Row: {
          created_at: string;
          data_hora: string;
          duracao_minutos: number | null;
          id: string;
          observacoes: string | null;
          origem: string;
          paciente_id: string;
          profissional_id: string;
          servico_id: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          data_hora: string;
          duracao_minutos?: number | null;
          id?: string;
          observacoes?: string | null;
          origem?: string;
          paciente_id: string;
          profissional_id: string;
          servico_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          data_hora?: string;
          duracao_minutos?: number | null;
          id?: string;
          observacoes?: string | null;
          origem?: string;
          paciente_id?: string;
          profissional_id?: string;
          servico_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agendamentos_paciente_id_fkey";
            columns: ["paciente_id"];
            isOneToOne: false;
            referencedRelation: "pacientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agendamentos_profissional_id_fkey";
            columns: ["profissional_id"];
            isOneToOne: false;
            referencedRelation: "profissionais";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agendamentos_servico_id_fkey";
            columns: ["servico_id"];
            isOneToOne: false;
            referencedRelation: "servicos";
            referencedColumns: ["id"];
          },
        ];
      };
      atividades: {
        Row: {
          created_at: string;
          descricao: string | null;
          id: string;
          referencia_id: string | null;
          tipo: string;
          titulo: string;
        };
        Insert: {
          created_at?: string;
          descricao?: string | null;
          id?: string;
          referencia_id?: string | null;
          tipo: string;
          titulo: string;
        };
        Update: {
          created_at?: string;
          descricao?: string | null;
          id?: string;
          referencia_id?: string | null;
          tipo?: string;
          titulo?: string;
        };
        Relationships: [];
      };
      pacientes: {
        Row: {
          ativo: boolean;
          cpf: string | null;
          created_at: string;
          data_nascimento: string | null;
          email: string | null;
          endereco: string | null;
          id: string;
          nome: string;
          observacoes: string | null;
          telefone: string | null;
          updated_at: string;
        };
        Insert: {
          ativo?: boolean;
          cpf?: string | null;
          created_at?: string;
          data_nascimento?: string | null;
          email?: string | null;
          endereco?: string | null;
          id?: string;
          nome: string;
          observacoes?: string | null;
          telefone?: string | null;
          updated_at?: string;
        };
        Update: {
          ativo?: boolean;
          cpf?: string | null;
          created_at?: string;
          data_nascimento?: string | null;
          email?: string | null;
          endereco?: string | null;
          id?: string;
          nome?: string;
          observacoes?: string | null;
          telefone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      profissionais: {
        Row: {
          ativo: boolean;
          created_at: string;
          cro: string | null;
          email: string | null;
          especialidade: string | null;
          id: string;
          nome: string;
          telefone: string | null;
          updated_at: string;
        };
        Insert: {
          ativo?: boolean;
          created_at?: string;
          cro?: string | null;
          email?: string | null;
          especialidade?: string | null;
          id?: string;
          nome: string;
          telefone?: string | null;
          updated_at?: string;
        };
        Update: {
          ativo?: boolean;
          created_at?: string;
          cro?: string | null;
          email?: string | null;
          especialidade?: string | null;
          id?: string;
          nome?: string;
          telefone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      servicos: {
        Row: {
          ativo: boolean;
          created_at: string;
          descricao: string | null;
          duracao_minutos: number | null;
          id: string;
          nome: string;
          preco: number | null;
          updated_at: string;
        };
        Insert: {
          ativo?: boolean;
          created_at?: string;
          descricao?: string | null;
          duracao_minutos?: number | null;
          id?: string;
          nome: string;
          preco?: number | null;
          updated_at?: string;
        };
        Update: {
          ativo?: boolean;
          created_at?: string;
          descricao?: string | null;
          duracao_minutos?: number | null;
          id?: string;
          nome?: string;
          preco?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      solicitacoes_agendamento: {
        Row: {
          agendamento_id: string | null;
          canal_origem: string;
          codigo_externo: string;
          created_at: string;
          data_hora_confirmada: string | null;
          dia_desejado: string | null;
          horario_desejado: string | null;
          id: string;
          nome_cliente: string;
          observacoes_admin: string | null;
          observacoes_cliente: string | null;
          origem: string;
          paciente_id: string | null;
          payload_externo: Json | null;
          procedimento_nome: string;
          profissional_id: string | null;
          resumo_atendimento: Json | null;
          servico_id: string | null;
          status: string;
          telefone_cliente: string;
          tipo_atendimento: "particular" | "convenio" | null;
          updated_at: string;
        };
        Insert: {
          agendamento_id?: string | null;
          canal_origem?: string;
          codigo_externo?: string;
          created_at?: string;
          data_hora_confirmada?: string | null;
          dia_desejado?: string | null;
          horario_desejado?: string | null;
          id?: string;
          nome_cliente: string;
          observacoes_admin?: string | null;
          observacoes_cliente?: string | null;
          origem?: string;
          paciente_id?: string | null;
          payload_externo?: Json | null;
          procedimento_nome?: string;
          profissional_id?: string | null;
          resumo_atendimento?: Json | null;
          servico_id?: string | null;
          status?: string;
          telefone_cliente: string;
          tipo_atendimento?: "particular" | "convenio" | null;
          updated_at?: string;
        };
        Update: {
          agendamento_id?: string | null;
          canal_origem?: string;
          codigo_externo?: string;
          created_at?: string;
          data_hora_confirmada?: string | null;
          dia_desejado?: string | null;
          horario_desejado?: string | null;
          id?: string;
          nome_cliente?: string;
          observacoes_admin?: string | null;
          observacoes_cliente?: string | null;
          origem?: string;
          paciente_id?: string | null;
          payload_externo?: Json | null;
          procedimento_nome?: string;
          profissional_id?: string | null;
          resumo_atendimento?: Json | null;
          servico_id?: string | null;
          status?: string;
          telefone_cliente?: string;
          tipo_atendimento?: "particular" | "convenio" | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "solicitacoes_agendamento_agendamento_id_fkey";
            columns: ["agendamento_id"];
            isOneToOne: false;
            referencedRelation: "agendamentos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "solicitacoes_agendamento_paciente_id_fkey";
            columns: ["paciente_id"];
            isOneToOne: false;
            referencedRelation: "pacientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "solicitacoes_agendamento_profissional_id_fkey";
            columns: ["profissional_id"];
            isOneToOne: false;
            referencedRelation: "profissionais";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "solicitacoes_agendamento_servico_id_fkey";
            columns: ["servico_id"];
            isOneToOne: false;
            referencedRelation: "servicos";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      cancelar_solicitacao_agendamento: {
        Args: {
          p_observacoes_admin?: string | null;
          p_solicitacao_id: string;
        };
        Returns: string;
      };
      confirmar_solicitacao_agendamento: {
        Args: {
          p_data_hora: string;
          p_observacoes_admin?: string | null;
          p_paciente_id?: string | null;
          p_profissional_id: string;
          p_servico_id: string;
          p_solicitacao_id: string;
        };
        Returns: string;
      };
      rpc_financeiro_devedores: {
        Args: {
          p_limit?: number;
          p_paciente_id?: string | null;
        };
        Returns: {
          dias_atraso: number;
          email: string | null;
          nome: string;
          paciente_id: string;
          quantidade_faturas_vencidas: number;
          telefone: string | null;
          total_devido: number;
        }[];
      };
      rpc_financeiro_resumo: {
        Args: {
          p_data_fim: string;
          p_data_inicio: string;
          p_paciente_id?: string | null;
        };
        Returns: {
          periodo_fim: string;
          periodo_inicio: string;
          quantidade_faturas: number;
          quantidade_faturas_pagas: number;
          quantidade_faturas_pendentes: number;
          taxa_recebimento: number;
          total_desconto_aplicado: number;
          total_faturado: number;
          total_pendente: number;
          total_recebido: number;
          total_vencido: number;
        }[];
      };
      rpc_overview_chart_semana: {
        Args: Record<PropertyKey, never>;
        Returns: {
          day: string;
          value: number;
        }[];
      };
      rpc_overview_kpis: {
        Args: Record<PropertyKey, never>;
        Returns: {
          confirmacoes_ia_hoje: number;
          pendencias_operacionais: number;
          solicitacoes_hoje: number;
          total_pacientes: number;
        }[];
      };
      generate_solicitacao_codigo_externo: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      remarcar_solicitacao_agendamento: {
        Args: {
          p_data_hora?: string | null;
          p_observacoes_admin?: string | null;
          p_profissional_id?: string | null;
          p_servico_id?: string | null;
          p_solicitacao_id: string;
        };
        Returns: string;
      };
      upsert_paciente_por_telefone: {
        Args: {
          p_nome: string | null;
          p_telefone: string;
        };
        Returns: string;
      };
    };
    Enums: {
      app_role: "admin" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals["public"];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer Row;
    }
    ? Row
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer Row;
      }
      ? Row
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer Insert;
    }
    ? Insert
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer Insert;
      }
      ? Insert
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer Update;
    }
    ? Update
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer Update;
      }
      ? Update
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;
