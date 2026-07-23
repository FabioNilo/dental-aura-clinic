-- ============================================================================
-- Clinic schema foundation for the n8n migration
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_namespace where nspname = 'auth') then
    raise exception 'Esta migration e exclusiva do Supabase e depende do schema auth. Para o PostgreSQL dedicado do Dental Aura, rode n8n/dental/00-infra/dental-aura-postgres-schema.sql.';
  end if;
end;
$$;

create schema if not exists clinic;

create or replace function clinic.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function clinic.generate_solicitacao_codigo_externo()
returns text
language plpgsql
as $$
begin
  return 'SOL-'
    || to_char(timezone('America/Sao_Paulo', now()), 'YYYYMMDDHH24MISS')
    || '-'
    || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6));
end;
$$;

create table if not exists clinic.access_roles (
  id uuid primary key default gen_random_uuid(),
  identity_provider text not null default 'supabase',
  email text,
  supabase_user_id uuid,
  role text not null default 'admin',
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint clinic_access_roles_provider_email_key unique (identity_provider, email),
  constraint clinic_access_roles_supabase_user_key unique (supabase_user_id)
);

create index if not exists idx_clinic_access_roles_supabase_user_id
  on clinic.access_roles (supabase_user_id);

create index if not exists idx_clinic_access_roles_email
  on clinic.access_roles (email);

create index if not exists idx_clinic_access_roles_role_active
  on clinic.access_roles (role, active);

create trigger touch_clinic_access_roles_updated_at
  before update on clinic.access_roles
  for each row
  execute function clinic.touch_updated_at();

create table if not exists clinic.clinic_settings (
  setting_key text primary key,
  setting_value jsonb not null default '{}'::jsonb,
  scope text not null default 'global',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create trigger touch_clinic_settings_updated_at
  before update on clinic.clinic_settings
  for each row
  execute function clinic.touch_updated_at();

create table if not exists clinic.pacientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text,
  telefone text,
  telefone_normalizado text,
  email text,
  data_nascimento date,
  endereco text,
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_clinic_pacientes_telefone_normalizado
  on clinic.pacientes (telefone_normalizado);

create index if not exists idx_clinic_pacientes_nome
  on clinic.pacientes (nome);

create trigger touch_clinic_pacientes_updated_at
  before update on clinic.pacientes
  for each row
  execute function clinic.touch_updated_at();

create table if not exists clinic.profissionais (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  especialidade text,
  cro text,
  telefone text,
  email text,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_clinic_profissionais_ativo
  on clinic.profissionais (ativo);

create index if not exists idx_clinic_profissionais_nome
  on clinic.profissionais (nome);

create trigger touch_clinic_profissionais_updated_at
  before update on clinic.profissionais
  for each row
  execute function clinic.touch_updated_at();

create table if not exists clinic.servicos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  categoria text,
  preco numeric(10, 2) not null default 0,
  duracao_minutos integer,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_clinic_servicos_ativo
  on clinic.servicos (ativo);

create index if not exists idx_clinic_servicos_nome
  on clinic.servicos (nome);

create trigger touch_clinic_servicos_updated_at
  before update on clinic.servicos
  for each row
  execute function clinic.touch_updated_at();

create table if not exists clinic.conversas_atendimento (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references clinic.pacientes (id) on delete set null,
  telefone_normalizado text not null,
  canal text not null default 'whatsapp',
  status text not null default 'aberta',
  ultima_mensagem_em timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_clinic_conversas_paciente_id
  on clinic.conversas_atendimento (paciente_id);

create index if not exists idx_clinic_conversas_telefone_normalizado
  on clinic.conversas_atendimento (telefone_normalizado);

create index if not exists idx_clinic_conversas_ultima_mensagem_em
  on clinic.conversas_atendimento (ultima_mensagem_em desc);

create trigger touch_clinic_conversas_atendimento_updated_at
  before update on clinic.conversas_atendimento
  for each row
  execute function clinic.touch_updated_at();

create table if not exists clinic.mensagens_atendimento (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references clinic.conversas_atendimento (id) on delete cascade,
  external_message_id text,
  direcao text not null check (direcao in ('inbound', 'outbound')),
  tipo_mensagem text not null default 'text',
  conteudo text,
  payload_bruto jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint clinic_mensagens_atendimento_external_message_unique unique (conversa_id, external_message_id)
);

create index if not exists idx_clinic_mensagens_conversa_id
  on clinic.mensagens_atendimento (conversa_id, created_at desc);

create table if not exists clinic.solicitacoes_agendamento (
  id uuid primary key default gen_random_uuid(),
  codigo_externo text not null default clinic.generate_solicitacao_codigo_externo(),
  status text not null default 'novo' check (
    status in (
      'novo',
      'em_triagem',
      'aguardando_confirmacao',
      'agendado',
      'remarcacao_solicitada',
      'cancelamento_solicitado',
      'cancelado'
    )
  ),
  origem text not null default 'manual',
  canal_origem text not null default 'n8n',
  paciente_id uuid references clinic.pacientes (id) on delete set null,
  agendamento_id uuid,
  profissional_id uuid references clinic.profissionais (id) on delete set null,
  servico_id uuid references clinic.servicos (id) on delete set null,
  nome_cliente text not null,
  telefone_cliente text not null,
  procedimento_nome text not null default 'Consulta geral',
  tipo_atendimento text check (tipo_atendimento in ('particular', 'convenio')),
  dia_desejado date,
  horario_desejado time,
  data_hora_confirmada timestamptz,
  observacoes_cliente text,
  observacoes_admin text,
  payload_externo jsonb,
  resumo_atendimento jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint clinic_solicitacoes_agendamento_codigo_externo_key unique (codigo_externo)
);

create index if not exists idx_clinic_solicitacoes_status
  on clinic.solicitacoes_agendamento (status, created_at desc);

create index if not exists idx_clinic_solicitacoes_paciente_id
  on clinic.solicitacoes_agendamento (paciente_id);

create index if not exists idx_clinic_solicitacoes_agendamento_id
  on clinic.solicitacoes_agendamento (agendamento_id);

create index if not exists idx_clinic_solicitacoes_telefone_cliente
  on clinic.solicitacoes_agendamento (telefone_cliente);

create trigger touch_clinic_solicitacoes_agendamento_updated_at
  before update on clinic.solicitacoes_agendamento
  for each row
  execute function clinic.touch_updated_at();

create table if not exists clinic.agendamentos (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references clinic.pacientes (id) on delete cascade,
  profissional_id uuid not null references clinic.profissionais (id) on delete restrict,
  servico_id uuid references clinic.servicos (id) on delete set null,
  data_hora timestamptz not null,
  duracao_minutos integer,
  status text not null default 'confirmado' check (
    status in ('confirmado', 'remarcado', 'cancelado', 'concluido', 'faltou')
  ),
  origem text not null default 'solicitacao',
  observacoes text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_clinic_agendamentos_data_hora
  on clinic.agendamentos (data_hora);

create index if not exists idx_clinic_agendamentos_paciente_id
  on clinic.agendamentos (paciente_id);

create index if not exists idx_clinic_agendamentos_profissional_id
  on clinic.agendamentos (profissional_id);

create index if not exists idx_clinic_agendamentos_status
  on clinic.agendamentos (status);

create trigger touch_clinic_agendamentos_updated_at
  before update on clinic.agendamentos
  for each row
  execute function clinic.touch_updated_at();

alter table clinic.solicitacoes_agendamento
  add constraint clinic_solicitacoes_agendamento_agendamento_id_fkey
  foreign key (agendamento_id) references clinic.agendamentos (id) on delete set null;

create table if not exists clinic.atividades (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  titulo text not null,
  descricao text,
  referencia_id text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_clinic_atividades_tipo_created_at
  on clinic.atividades (tipo, created_at desc);

create table if not exists clinic.integration_webhook_inbox (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  event_type text not null,
  external_id text not null,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default timezone('utc'::text, now()),
  processed_at timestamptz,
  status text not null default 'pending',
  error_message text,
  constraint clinic_integration_webhook_inbox_unique unique (source, external_id)
);

create index if not exists idx_clinic_inbox_status_received_at
  on clinic.integration_webhook_inbox (status, received_at desc);

create table if not exists clinic.integration_outbox (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  aggregate_type text not null,
  aggregate_id text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  retry_count integer not null default 0,
  next_retry_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  processed_at timestamptz
);

create index if not exists idx_clinic_outbox_status_next_retry_at
  on clinic.integration_outbox (status, next_retry_at);

create table if not exists clinic.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_key text not null,
  trigger_source text not null,
  status text not null default 'running',
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb,
  error_message text,
  started_at timestamptz not null default timezone('utc'::text, now()),
  finished_at timestamptz
);

create index if not exists idx_clinic_workflow_runs_workflow_key_status
  on clinic.workflow_runs (workflow_key, status);

create table if not exists clinic.sync_state (
  integration_name text primary key,
  cursor_value text,
  last_synced_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

alter table clinic.access_roles enable row level security;
alter table clinic.clinic_settings enable row level security;
alter table clinic.pacientes enable row level security;
alter table clinic.profissionais enable row level security;
alter table clinic.servicos enable row level security;
alter table clinic.conversas_atendimento enable row level security;
alter table clinic.mensagens_atendimento enable row level security;
alter table clinic.solicitacoes_agendamento enable row level security;
alter table clinic.agendamentos enable row level security;
alter table clinic.atividades enable row level security;
alter table clinic.integration_webhook_inbox enable row level security;
alter table clinic.integration_outbox enable row level security;
alter table clinic.workflow_runs enable row level security;
alter table clinic.sync_state enable row level security;

create policy "clinic_access_roles_select_authenticated" on clinic.access_roles
  for select using (auth.role() = 'authenticated');

create policy "clinic_settings_select_authenticated" on clinic.clinic_settings
  for select using (auth.role() = 'authenticated');

create policy "clinic_pacientes_select_authenticated" on clinic.pacientes
  for select using (auth.role() = 'authenticated');

create policy "clinic_pacientes_write_authenticated" on clinic.pacientes
  for insert with check (auth.role() = 'authenticated');

create policy "clinic_pacientes_update_authenticated" on clinic.pacientes
  for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "clinic_profissionais_select_authenticated" on clinic.profissionais
  for select using (auth.role() = 'authenticated');

create policy "clinic_profissionais_write_authenticated" on clinic.profissionais
  for insert with check (auth.role() = 'authenticated');

create policy "clinic_profissionais_update_authenticated" on clinic.profissionais
  for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "clinic_servicos_select_authenticated" on clinic.servicos
  for select using (auth.role() = 'authenticated');

create policy "clinic_servicos_write_authenticated" on clinic.servicos
  for insert with check (auth.role() = 'authenticated');

create policy "clinic_servicos_update_authenticated" on clinic.servicos
  for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "clinic_conversas_select_authenticated" on clinic.conversas_atendimento
  for select using (auth.role() = 'authenticated');

create policy "clinic_conversas_write_authenticated" on clinic.conversas_atendimento
  for insert with check (auth.role() = 'authenticated');

create policy "clinic_conversas_update_authenticated" on clinic.conversas_atendimento
  for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "clinic_mensagens_select_authenticated" on clinic.mensagens_atendimento
  for select using (auth.role() = 'authenticated');

create policy "clinic_mensagens_write_authenticated" on clinic.mensagens_atendimento
  for insert with check (auth.role() = 'authenticated');

create policy "clinic_solicitacoes_select_authenticated" on clinic.solicitacoes_agendamento
  for select using (auth.role() = 'authenticated');

create policy "clinic_solicitacoes_write_authenticated" on clinic.solicitacoes_agendamento
  for insert with check (auth.role() = 'authenticated');

create policy "clinic_solicitacoes_update_authenticated" on clinic.solicitacoes_agendamento
  for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "clinic_agendamentos_select_authenticated" on clinic.agendamentos
  for select using (auth.role() = 'authenticated');

create policy "clinic_agendamentos_write_authenticated" on clinic.agendamentos
  for insert with check (auth.role() = 'authenticated');

create policy "clinic_agendamentos_update_authenticated" on clinic.agendamentos
  for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "clinic_atividades_select_authenticated" on clinic.atividades
  for select using (auth.role() = 'authenticated');

create policy "clinic_inbox_select_authenticated" on clinic.integration_webhook_inbox
  for select using (auth.role() = 'authenticated');

create policy "clinic_outbox_select_authenticated" on clinic.integration_outbox
  for select using (auth.role() = 'authenticated');

create policy "clinic_workflow_runs_select_authenticated" on clinic.workflow_runs
  for select using (auth.role() = 'authenticated');

create policy "clinic_sync_state_select_authenticated" on clinic.sync_state
  for select using (auth.role() = 'authenticated');
