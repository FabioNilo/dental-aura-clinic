-- FIX: RLS Policies para prontuarios e tratamentos
-- Este script relaxa as RLS policies para permitir usuários autenticados
-- Executar no Supabase Dashboard: https://wkikjfqewtmocwdrrcdz.supabase.co/project/wkikjfqewtmocwdrrcdz/sql

-- ============================================================================
-- DROP EXISTING POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Professionals can view all prontuarios" ON prontuarios;
DROP POLICY IF EXISTS "Professionals can insert prontuarios" ON prontuarios;
DROP POLICY IF EXISTS "Professionals can update prontuarios" ON prontuarios;
DROP POLICY IF EXISTS "Professionals can delete prontuarios" ON prontuarios;

DROP POLICY IF EXISTS "Professionals can view all tratamentos" ON tratamentos;
DROP POLICY IF EXISTS "Professionals can insert tratamentos" ON tratamentos;
DROP POLICY IF EXISTS "Professionals can update tratamentos" ON tratamentos;
DROP POLICY IF EXISTS "Professionals can delete tratamentos" ON tratamentos;

-- ============================================================================
-- CREATE NEW POLICIES (AUTHENTICATED USERS)
-- ============================================================================

-- RLS Policies for prontuarios
-- Allow authenticated users to view, insert, update, and delete
CREATE POLICY "Enable read for authenticated users" ON prontuarios
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON prontuarios
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON prontuarios
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON prontuarios
  FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies for tratamentos
-- Allow authenticated users to view, insert, update, and delete
CREATE POLICY "Enable read for authenticated users" ON tratamentos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON tratamentos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON tratamentos
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON tratamentos
  FOR DELETE USING (auth.role() = 'authenticated');
