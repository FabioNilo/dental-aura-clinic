-- Cleanup: Drop existing tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS public.cupom_uso CASCADE;
DROP TABLE IF EXISTS public.cupons_desconto CASCADE;
DROP TABLE IF EXISTS public.pagamentos CASCADE;
DROP TABLE IF EXISTS public.fatura_itens CASCADE;
DROP TABLE IF EXISTS public.faturas CASCADE;
DROP TABLE IF EXISTS public.orcamento_itens CASCADE;
DROP TABLE IF EXISTS public.orcamentos CASCADE;
DROP TABLE IF EXISTS public.servicos CASCADE;

-- Tabela de Serviços (Tabela de Preços)
CREATE TABLE public.servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco DECIMAL(10, 2) NOT NULL DEFAULT 0,
  categoria TEXT CHECK (categoria IN ('preventivo', 'corretivo', 'estetico', 'outro')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_servicos_ativo ON public.servicos(ativo);
CREATE INDEX idx_servicos_categoria ON public.servicos(categoria);

-- Tabela de Orçamentos
CREATE TABLE public.orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL,
  prontuario_id UUID,
  data_emissao DATE DEFAULT CURRENT_DATE NOT NULL,
  data_validade DATE,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviado', 'aceito', 'rejeitado', 'convertido_em_fatura')),
  valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  desconto_tipo TEXT CHECK (desconto_tipo IN ('percentual', 'fixo', NULL)),
  desconto_valor DECIMAL(10, 2) DEFAULT 0,
  observacoes TEXT,
  criado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT fk_orcamento_paciente FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id) ON DELETE CASCADE,
  CONSTRAINT fk_orcamento_prontuario FOREIGN KEY (prontuario_id) REFERENCES public.prontuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_orcamento_user FOREIGN KEY (criado_por) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_orcamentos_paciente ON public.orcamentos(paciente_id);
CREATE INDEX idx_orcamentos_prontuario ON public.orcamentos(prontuario_id);
CREATE INDEX idx_orcamentos_status ON public.orcamentos(status);
CREATE INDEX idx_orcamentos_data ON public.orcamentos(data_emissao);

-- Tabela de Itens do Orçamento
CREATE TABLE public.orcamento_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID NOT NULL,
  tratamento_id UUID,
  servico_id UUID,
  descricao TEXT NOT NULL,
  preco_unitario DECIMAL(10, 2) NOT NULL,
  quantidade INT DEFAULT 1,
  subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (preco_unitario * quantidade) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT fk_orcamento_item_orcamento FOREIGN KEY (orcamento_id) REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  CONSTRAINT fk_orcamento_item_tratamento FOREIGN KEY (tratamento_id) REFERENCES public.tratamentos(id) ON DELETE SET NULL,
  CONSTRAINT fk_orcamento_item_servico FOREIGN KEY (servico_id) REFERENCES public.servicos(id) ON DELETE SET NULL
);

CREATE INDEX idx_orcamento_itens_orcamento ON public.orcamento_itens(orcamento_id);

-- Tabela de Faturas
CREATE TABLE public.faturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL,
  prontuario_id UUID,
  orcamento_id UUID,
  numero_nf TEXT UNIQUE,
  data_emissao DATE DEFAULT CURRENT_DATE NOT NULL,
  data_vencimento DATE,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'emitida', 'parcialmente_paga', 'paga', 'cancelada')),
  valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  valor_pago DECIMAL(10, 2) DEFAULT 0,
  desconto_tipo TEXT CHECK (desconto_tipo IN ('percentual', 'fixo', NULL)),
  desconto_valor DECIMAL(10, 2) DEFAULT 0,
  observacoes TEXT,
  metodo_pagamento_default TEXT,
  criado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT fk_fatura_paciente FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id) ON DELETE CASCADE,
  CONSTRAINT fk_fatura_prontuario FOREIGN KEY (prontuario_id) REFERENCES public.prontuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_fatura_orcamento FOREIGN KEY (orcamento_id) REFERENCES public.orcamentos(id) ON DELETE SET NULL,
  CONSTRAINT fk_fatura_user FOREIGN KEY (criado_por) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_faturas_paciente ON public.faturas(paciente_id);
CREATE INDEX idx_faturas_prontuario ON public.faturas(prontuario_id);
CREATE INDEX idx_faturas_status ON public.faturas(status);
CREATE INDEX idx_faturas_data ON public.faturas(data_emissao);
CREATE INDEX idx_faturas_numero ON public.faturas(numero_nf);

-- Tabela de Itens da Fatura
CREATE TABLE public.fatura_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fatura_id UUID NOT NULL,
  tratamento_id UUID,
  servico_id UUID,
  descricao TEXT NOT NULL,
  preco_unitario DECIMAL(10, 2) NOT NULL,
  quantidade INT DEFAULT 1,
  subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (preco_unitario * quantidade) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT fk_fatura_item_fatura FOREIGN KEY (fatura_id) REFERENCES public.faturas(id) ON DELETE CASCADE,
  CONSTRAINT fk_fatura_item_tratamento FOREIGN KEY (tratamento_id) REFERENCES public.tratamentos(id) ON DELETE SET NULL,
  CONSTRAINT fk_fatura_item_servico FOREIGN KEY (servico_id) REFERENCES public.servicos(id) ON DELETE SET NULL
);

CREATE INDEX idx_fatura_itens_fatura ON public.fatura_itens(fatura_id);

-- Tabela de Pagamentos
CREATE TABLE public.pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fatura_id UUID NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  data_pagamento DATE DEFAULT CURRENT_DATE NOT NULL,
  metodo_pagamento TEXT NOT NULL CHECK (metodo_pagamento IN ('dinheiro', 'pix', 'cartao_credito', 'transferencia', 'cheque', 'outro')),
  referencia TEXT,
  notas TEXT,
  registrado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT fk_pagamento_fatura FOREIGN KEY (fatura_id) REFERENCES public.faturas(id) ON DELETE CASCADE,
  CONSTRAINT fk_pagamento_user FOREIGN KEY (registrado_por) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_pagamentos_fatura ON public.pagamentos(fatura_id);
CREATE INDEX idx_pagamentos_data ON public.pagamentos(data_pagamento);
CREATE INDEX idx_pagamentos_metodo ON public.pagamentos(metodo_pagamento);

-- Tabela de Cupons de Desconto
CREATE TABLE public.cupons_desconto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('percentual', 'fixo')),
  valor DECIMAL(10, 2) NOT NULL,
  validade_inicio DATE DEFAULT CURRENT_DATE NOT NULL,
  validade_fim DATE,
  uso_maximo INT,
  uso_atual INT DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  criado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT fk_cupom_user FOREIGN KEY (criado_por) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_cupons_codigo ON public.cupons_desconto(codigo);
CREATE INDEX idx_cupons_ativo ON public.cupons_desconto(ativo);
CREATE INDEX idx_cupons_validade ON public.cupons_desconto(validade_fim);

-- Tabela de Histórico de Cupom (Auditoria)
CREATE TABLE public.cupom_uso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cupom_id UUID NOT NULL,
  fatura_id UUID NOT NULL,
  data_uso DATE DEFAULT CURRENT_DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT fk_cupom_uso_cupom FOREIGN KEY (cupom_id) REFERENCES public.cupons_desconto(id) ON DELETE CASCADE,
  CONSTRAINT fk_cupom_uso_fatura FOREIGN KEY (fatura_id) REFERENCES public.faturas(id) ON DELETE CASCADE
);

CREATE INDEX idx_cupom_uso_cupom ON public.cupom_uso(cupom_id);
CREATE INDEX idx_cupom_uso_fatura ON public.cupom_uso(fatura_id);

-- Enable RLS
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fatura_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupons_desconto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupom_uso ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Serviços (todos podem visualizar)
CREATE POLICY "Serviços leíveis por todos autenticados" ON public.servicos
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Serviços editáveis" ON public.servicos
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Serviços Update" ON public.servicos
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- RLS Policies: Orçamentos
CREATE POLICY "Orçamentos visualizáveis" ON public.orcamentos
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Orçamentos criáveis" ON public.orcamentos
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Orçamentos Update" ON public.orcamentos
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Orçamentos Delete" ON public.orcamentos
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- RLS Policies: Itens do Orçamento
CREATE POLICY "Itens orçamento leíveis" ON public.orcamento_itens
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Itens orçamento inseríveis" ON public.orcamento_itens
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Itens orçamento deletáveis" ON public.orcamento_itens
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- RLS Policies: Faturas
CREATE POLICY "Faturas visualizáveis" ON public.faturas
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Faturas criáveis" ON public.faturas
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Faturas Update" ON public.faturas
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- RLS Policies: Itens da Fatura
CREATE POLICY "Itens fatura leíveis" ON public.fatura_itens
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Itens fatura inseríveis" ON public.fatura_itens
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Itens fatura deletáveis" ON public.fatura_itens
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- RLS Policies: Pagamentos
CREATE POLICY "Pagamentos visualizáveis" ON public.pagamentos
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Pagamentos registráveis" ON public.pagamentos
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies: Cupons
CREATE POLICY "Cupons visualizáveis" ON public.cupons_desconto
  FOR SELECT
  USING (auth.role() = 'authenticated' AND ativo = true);

CREATE POLICY "Cupons criáveis" ON public.cupons_desconto
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Cupons Update" ON public.cupons_desconto
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- RLS Policies: Cupom Uso
CREATE POLICY "Cupom uso visualizável" ON public.cupom_uso
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Cupom uso registrável" ON public.cupom_uso
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
