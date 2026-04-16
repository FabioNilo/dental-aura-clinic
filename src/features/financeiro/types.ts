// Enum de Status
export const ORCAMENTO_STATUS = {
  rascunho: "rascunho",
  enviado: "enviado",
  aceito: "aceito",
  rejeitado: "rejeitado",
  convertido_em_fatura: "convertido_em_fatura",
} as const;

export const FATURA_STATUS = {
  rascunho: "rascunho",
  emitida: "emitida",
  parcialmente_paga: "parcialmente_paga",
  paga: "paga",
  cancelada: "cancelada",
} as const;

export const SERVICO_CATEGORIA = {
  preventivo: "preventivo",
  corretivo: "corretivo",
  estetico: "estetico",
  outro: "outro",
} as const;

export const METODO_PAGAMENTO = {
  dinheiro: "dinheiro",
  pix: "pix",
  cartao_credito: "cartao_credito",
  transferencia: "transferencia",
  cheque: "cheque",
  outro: "outro",
} as const;

export const DESCONTO_TIPO = {
  percentual: "percentual",
  fixo: "fixo",
} as const;

export const CUPOM_TIPO = {
  percentual: "percentual",
  fixo: "fixo",
} as const;

// Types
export type OrcamentoStatusType = (typeof ORCAMENTO_STATUS)[keyof typeof ORCAMENTO_STATUS];
export type FaturaStatusType = (typeof FATURA_STATUS)[keyof typeof FATURA_STATUS];
export type ServicoCategoria = (typeof SERVICO_CATEGORIA)[keyof typeof SERVICO_CATEGORIA];
export type MetodoPagamento = (typeof METODO_PAGAMENTO)[keyof typeof METODO_PAGAMENTO];
export type DescontoTipo = (typeof DESCONTO_TIPO)[keyof typeof DESCONTO_TIPO];
export type CupomTipo = (typeof CUPOM_TIPO)[keyof typeof CUPOM_TIPO];

// ============ Serviços ============
export interface Servico {
  id: string;
  nome: string;
  descricao?: string | null;
  preco: number;
  categoria?: ServicoCategoria | null;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export type CreateServicoInput = Omit<Servico, "id" | "created_at" | "updated_at">;
export type UpdateServicoInput = Partial<CreateServicoInput> & { id: string };

// ============ Orçamentos ============
export interface OrcamentoItem {
  id: string;
  orcamento_id: string;
  tratamento_id?: string | null;
  servico_id?: string | null;
  descricao: string;
  preco_unitario: number;
  quantidade: number;
  subtotal: number;
  created_at?: string;
}

export interface Orcamento {
  id: string;
  paciente_id: string;
  prontuario_id?: string | null;
  data_emissao: string;
  data_validade?: string | null;
  status: OrcamentoStatusType;
  valor_total: number;
  desconto_tipo?: DescontoTipo | null;
  desconto_valor: number;
  observacoes?: string | null;
  criado_por?: string | null;
  created_at?: string;
  updated_at?: string;
  itens?: OrcamentoItem[];
}

export type OrcamentoListItem = Pick<
  Orcamento,
  "created_at" | "data_emissao" | "data_validade" | "id" | "paciente_id" | "status" | "valor_total"
>;

export type CreateOrcamentoInput = {
  paciente_id: string;
  prontuario_id?: string | null;
  data_emissao?: string;
  data_validade?: string | null;
  status?: OrcamentoStatusType;
  valor_total: number;
  desconto_tipo?: DescontoTipo | null;
  desconto_valor?: number;
  observacoes?: string | null;
  itens?: CreateOrcamentoItemInput[];
};

export type CreateOrcamentoItemInput = {
  tratamento_id?: string | null;
  servico_id?: string | null;
  descricao: string;
  preco_unitario: number;
  quantidade?: number;
};

export type UpdateOrcamentoInput = Partial<CreateOrcamentoInput> & { id: string };

// ============ Faturas ============
export interface FaturaItem {
  id: string;
  fatura_id: string;
  tratamento_id?: string | null;
  servico_id?: string | null;
  descricao: string;
  preco_unitario: number;
  quantidade: number;
  subtotal: number;
  created_at?: string;
}

export interface Fatura {
  id: string;
  paciente_id: string;
  prontuario_id?: string | null;
  orcamento_id?: string | null;
  numero_nf?: string | null;
  data_emissao: string;
  data_vencimento?: string | null;
  status: FaturaStatusType;
  valor_total: number;
  valor_pago: number;
  desconto_tipo?: DescontoTipo | null;
  desconto_valor: number;
  observacoes?: string | null;
  metodo_pagamento_default?: MetodoPagamento | null;
  criado_por?: string | null;
  created_at?: string;
  updated_at?: string;
  itens?: FaturaItem[];
}

export type FaturaListItem = Pick<
  Fatura,
  | "data_emissao"
  | "data_vencimento"
  | "id"
  | "numero_nf"
  | "paciente_id"
  | "status"
  | "valor_pago"
  | "valor_total"
>;

export type CreateFaturaInput = {
  paciente_id: string;
  prontuario_id?: string | null;
  orcamento_id?: string | null;
  numero_nf?: string;
  data_emissao?: string;
  data_vencimento?: string | null;
  status?: FaturaStatusType;
  valor_total: number;
  desconto_tipo?: DescontoTipo | null;
  desconto_valor?: number;
  observacoes?: string | null;
  metodo_pagamento_default?: MetodoPagamento | null;
  itens?: CreateFaturaItemInput[];
};

export type CreateFaturaItemInput = {
  tratamento_id?: string | null;
  servico_id?: string | null;
  descricao: string;
  preco_unitario: number;
  quantidade?: number;
};

export type UpdateFaturaInput = Partial<CreateFaturaInput> & { id: string };

// ============ Pagamentos ============
export interface Pagamento {
  id: string;
  fatura_id: string;
  valor: number;
  data_pagamento: string;
  metodo_pagamento: MetodoPagamento;
  referencia?: string | null;
  notas?: string | null;
  registrado_por?: string | null;
  created_at?: string;
}

export type CreatePagamentoInput = {
  fatura_id: string;
  valor: number;
  data_pagamento?: string;
  metodo_pagamento: MetodoPagamento;
  referencia?: string | null;
  notas?: string | null;
};

// ============ Cupons de Desconto ============
export interface CupomDesconto {
  id: string;
  codigo: string;
  descricao?: string | null;
  tipo: CupomTipo;
  valor: number;
  validade_inicio: string;
  validade_fim?: string | null;
  uso_maximo?: number | null;
  uso_atual: number;
  ativo: boolean;
  criado_por?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type CreateCupomInput = Omit<CupomDesconto, "id" | "uso_atual" | "created_at" | "updated_at">;
export type UpdateCupomInput = Partial<CreateCupomInput> & { id: string };

export interface CupomUso {
  id: string;
  cupom_id: string;
  fatura_id: string;
  data_uso: string;
  created_at?: string;
}

// ============ Tipos Derivados / Compostos ============

/**
 * Dados agregados de uma fatura com paciente e histórico de pagamentos
 */
export interface FaturaComDetalhes extends Fatura {
  paciente?: {
    id: string;
    nome: string;
    cpf?: string;
  };
  pagamentos?: Pagamento[];
  saldo_pendente: number; // valor_total - valor_pago
  dias_atraso?: number; // Calculado a partir de data_vencimento vs hoje
}

/**
 * Dados agregados de um orçamento com paciente
 */
export interface OrcamentoComDetalhes extends Orcamento {
  paciente?: {
    id: string;
    nome: string;
  };
}

// ============ Filtros ============

export type OrcamentoFilters = {
  paciente_id?: string;
  status?: OrcamentoStatusType | OrcamentoStatusType[];
  data_inicio?: string;
  data_fim?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;
};

export type FaturaFilters = {
  paciente_id?: string;
  status?: FaturaStatusType | FaturaStatusType[];
  data_inicio?: string;
  data_fim?: string;
  apenas_vencidas?: boolean;
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;
};

export type PagamentoFilters = {
  fatura_id?: string;
  data_inicio?: string;
  data_fim?: string;
  metodo_pagamento?: MetodoPagamento;
  limit?: number;
  offset?: number;
};

// ============ Relatórios ============

export interface RelatorioFinanceiro {
  periodo: {
    inicio: string;
    fim: string;
  };
  total_faturado: number;
  total_recebido: number;
  total_pendente: number;
  total_vencido: number;
  total_desconto_aplicado: number;
  quantidade_faturas: number;
  quantidade_faturas_pagas: number;
  quantidade_faturas_pendentes: number;
  taxa_recebimento: number; // percentual
  taxa_conversao_orcamento?: number; // percentual
}

export interface DashboardCard {
  titulo: string;
  valor: number;
  icon: string;
  cor?: "primary" | "success" | "warning" | "destructive";
  comparacao?: {
    valor: number;
    percentual: number;
    direcao: "up" | "down";
  };
}

export interface PacienteComDebito {
  paciente_id: string;
  nome: string;
  email?: string;
  telefone?: string;
  total_devido: number;
  dias_atraso: number;
  quantidade_faturas_vencidas: number;
}

export interface TaxaConversaoOrcamento {
  total_orcamentos: number;
  orcamentos_aceitos: number;
  orcamentos_rejeitados: number;
  orcamentos_convertidos_faturas: number;
  taxa_aceitacao: number; // percentual
  taxa_conversao: number; // percentual
}
