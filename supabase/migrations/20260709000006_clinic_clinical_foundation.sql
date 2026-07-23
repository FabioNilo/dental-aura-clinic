-- ============================================================================
-- Clinic clinical foundation for the n8n migration
-- ============================================================================

create table if not exists clinic.prontuarios (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references clinic.pacientes (id) on delete cascade,
  agendamento_id uuid references clinic.agendamentos (id) on delete set null,
  profissional_id uuid references clinic.profissionais (id) on delete set null,
  profissional_nome text,
  data_consulta timestamptz not null default now(),
  queixa_principal text,
  historico_doencas text,
  alergias text,
  medicacoes_atuais text,
  exame_fisico text,
  diagnostico text,
  conduta text,
  observacoes_gerais text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_clinic_prontuarios_paciente_id
  on clinic.prontuarios (paciente_id);

create index if not exists idx_clinic_prontuarios_data_consulta
  on clinic.prontuarios (data_consulta desc);

create index if not exists idx_clinic_prontuarios_agendamento_id
  on clinic.prontuarios (agendamento_id);

create index if not exists idx_clinic_prontuarios_profissional_id
  on clinic.prontuarios (profissional_id);

create trigger touch_clinic_prontuarios_updated_at
  before update on clinic.prontuarios
  for each row
  execute function clinic.touch_updated_at();

alter table clinic.prontuarios enable row level security;

create policy "clinic_prontuarios_select_authenticated" on clinic.prontuarios
  for select using (auth.role() = 'authenticated');

create policy "clinic_prontuarios_insert_authenticated" on clinic.prontuarios
  for insert with check (auth.role() = 'authenticated');

create policy "clinic_prontuarios_update_authenticated" on clinic.prontuarios
  for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "clinic_prontuarios_delete_authenticated" on clinic.prontuarios
  for delete using (auth.role() = 'authenticated');

create table if not exists clinic.tratamentos (
  id uuid primary key default gen_random_uuid(),
  prontuario_id uuid not null references clinic.prontuarios (id) on delete cascade,
  paciente_id uuid not null references clinic.pacientes (id) on delete cascade,
  servico_id uuid references clinic.servicos (id) on delete set null,
  servico_nome text,
  dente_numero varchar(2),
  procedimento_descricao text not null,
  status text not null default 'diagnostico' check (
    status in ('diagnostico', 'orcamento', 'data', 'em_andamento', 'concluido', 'cancelado')
  ),
  data_diagnostico date,
  data_orcamento date,
  data_prevista date,
  num_sessoes_total integer,
  num_sessoes_realizadas integer not null default 0,
  notas_sessao text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_clinic_tratamentos_paciente_id
  on clinic.tratamentos (paciente_id);

create index if not exists idx_clinic_tratamentos_prontuario_id
  on clinic.tratamentos (prontuario_id);

create index if not exists idx_clinic_tratamentos_status
  on clinic.tratamentos (status);

create index if not exists idx_clinic_tratamentos_dente
  on clinic.tratamentos (dente_numero);

create trigger touch_clinic_tratamentos_updated_at
  before update on clinic.tratamentos
  for each row
  execute function clinic.touch_updated_at();

alter table clinic.tratamentos enable row level security;

create policy "clinic_tratamentos_select_authenticated" on clinic.tratamentos
  for select using (auth.role() = 'authenticated');

create policy "clinic_tratamentos_insert_authenticated" on clinic.tratamentos
  for insert with check (auth.role() = 'authenticated');

create policy "clinic_tratamentos_update_authenticated" on clinic.tratamentos
  for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "clinic_tratamentos_delete_authenticated" on clinic.tratamentos
  for delete using (auth.role() = 'authenticated');
