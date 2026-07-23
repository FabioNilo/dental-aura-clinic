// Enums
export const TRATAMENTO_STATUS = {
  diagnostico: "diagnostico",
  orcamento: "orcamento",
  data: "data",
  em_andamento: "em_andamento",
  concluido: "concluido",
  cancelado: "cancelado",
} as const;

export type TratamentoStatusType = (typeof TRATAMENTO_STATUS)[keyof typeof TRATAMENTO_STATUS];

// Base types - Custom definitions since Supabase types don't include these tables
export interface ProntuarioRecord {
  id: string;
  paciente_id: string;
  agendamento_id?: string | null;
  profissional_id?: string | null;
  profissional_nome?: string | null;
  queixa_principal?: string | null;
  historico_doencas?: string | null;
  alergias?: string | null;
  medicacoes_atuais?: string | null;
  exame_fisico?: string | null;
  diagnostico?: string | null;
  conduta?: string | null;
  observacoes_gerais?: string | null;
  data_consulta?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TratamentoRecord {
  id: string;
  prontuario_id: string;
  paciente_id?: string | null;
  dente_numero?: number | null;
  servico_id?: string | null;
  servico_nome?: string | null;
  procedimento_descricao?: string | null;
  status: TratamentoStatusType;
  orcamento?: number | null;
  data_diagnostico?: string | null;
  data_orcamento?: string | null;
  data_prevista?: string | null;
  num_sessoes_total?: number | null;
  num_sessoes_estimadas?: number | null;
  num_sessoes_realizadas?: number | null;
  notas_sessao?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Input types for creating/updating
export type CreateProntuarioInput = {
  paciente_id: string;
  agendamento_id?: string | null;
  profissional_id?: string | null;
  profissional_nome?: string | null;
  queixa_principal?: string | null;
  historico_doencas?: string | null;
  alergias?: string | null;
  medicacoes_atuais?: string | null;
  exame_fisico?: string | null;
  diagnostico?: string | null;
  conduta?: string | null;
  observacoes_gerais?: string | null;
};

export type UpdateProntuarioInput = CreateProntuarioInput & {
  id: string;
};

export type CreateTratamentoInput = {
  prontuario_id: string;
  paciente_id: string;
  servico_id?: string | null;
  servico_nome?: string | null;
  dente_numero?: string | null;
  procedimento_descricao: string;
  status?: TratamentoStatusType;
  data_diagnostico?: string | null;
  data_orcamento?: string | null;
  data_prevista?: string | null;
  num_sessoes_total?: number | null;
};

export type UpdateTratamentoInput = Partial<CreateTratamentoInput> & {
  id: string;
};

export type RegistrarSessaoInput = {
  tratamento_id: string;
  notas_sessao?: string | null;
};

// Display/UI types
export type ProntuarioComTratamentos = ProntuarioRecord & {
  paciente?: {
    id: string;
    nome: string;
  };
  profissional?: {
    id: string;
    nome: string;
  };
  tratamentos?: TratamentoRecord[];
};

export type TratamentoComDetalhes = TratamentoRecord & {
  servico?: {
    id: string;
    nome: string;
  };
};

// Filter/Query types
export type ProntuarioFilters = {
  paciente_id: string;
  limit?: number;
  offset?: number;
};

export type TratamentoFilters = {
  paciente_id?: string;
  prontuario_id?: string;
  status?: TratamentoStatusType | TratamentoStatusType[];
  limit?: number;
  offset?: number;
};

// Summary types for lists
export type ProntuarioSummary = {
  id: string;
  data_consulta: string;
  queixa_principal?: string | null;
  profissional_nome?: string;
  numero_tratamentos: number;
};
