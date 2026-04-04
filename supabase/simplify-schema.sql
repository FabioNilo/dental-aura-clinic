-- ============================================================================
-- SIMPLIFICAR SCHEMA: Remove Foreign Keys Complexas
-- Executar no Supabase Dashboard SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP EXISTING TABLES (Rebuild com schema simplificado)
-- ============================================================================

DROP TABLE IF EXISTS tratamentos CASCADE;
DROP TABLE IF EXISTS prontuarios CASCADE;

-- ============================================================================
-- STEP 2: CREATE PRONTUARIOS TABLE (SIMPLIFIED)
-- ============================================================================

CREATE TABLE IF NOT EXISTS prontuarios (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL,
  agendamento_id uuid,
  profissional_id uuid,
  profissional_nome TEXT,
  data_consulta timestamp NOT NULL DEFAULT now(),
  queixa_principal TEXT,
  historico_doencas TEXT,
  alergias TEXT,
  medicacoes_atuais TEXT,
  exame_fisico TEXT,
  diagnostico TEXT,
  conduta TEXT,
  observacoes_gerais TEXT,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- ============================================================================
-- STEP 3: CREATE TRATAMENTOS TABLE (SIMPLIFIED)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tratamentos (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  prontuario_id uuid NOT NULL,
  paciente_id uuid NOT NULL,
  servico_id uuid,
  servico_nome TEXT,
  dente_numero VARCHAR(2),
  procedimento_descricao TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'diagnostico' CHECK (status IN ('diagnostico', 'orcamento', 'data', 'em_andamento', 'concluido', 'cancelado')),
  data_diagnostico DATE,
  data_orcamento DATE,
  data_prevista DATE,
  num_sessoes_total INTEGER,
  num_sessoes_realizadas INTEGER NOT NULL DEFAULT 0,
  notas_sessao TEXT,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- ============================================================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_prontuarios_paciente_id ON prontuarios(paciente_id);
CREATE INDEX IF NOT EXISTS idx_prontuarios_data_consulta ON prontuarios(data_consulta DESC);
CREATE INDEX IF NOT EXISTS idx_prontuarios_agendamento_id ON prontuarios(agendamento_id);
CREATE INDEX IF NOT EXISTS idx_prontuarios_profissional_id ON prontuarios(profissional_id);

CREATE INDEX IF NOT EXISTS idx_tratamentos_paciente_id ON tratamentos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_tratamentos_prontuario_id ON tratamentos(prontuario_id);
CREATE INDEX IF NOT EXISTS idx_tratamentos_status ON tratamentos(status);
CREATE INDEX IF NOT EXISTS idx_tratamentos_dente ON tratamentos(dente_numero);

-- ============================================================================
-- STEP 5: ENABLE RLS (Row Level Security)
-- ============================================================================

ALTER TABLE prontuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tratamentos ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: CREATE RLS POLICIES (Authenticated Users)
-- ============================================================================

CREATE POLICY "Enable read for authenticated users" ON prontuarios
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON prontuarios
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON prontuarios
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON prontuarios
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read for authenticated users" ON tratamentos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON tratamentos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON tratamentos
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON tratamentos
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- STEP 7: CREATE TRIGGERS FOR TIMESTAMP
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prontuarios_updated_at
  BEFORE UPDATE ON prontuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tratamentos_updated_at
  BEFORE UPDATE ON tratamentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
