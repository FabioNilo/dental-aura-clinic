-- ============================================================================
-- Clinic finance foundation for the n8n migration
-- ============================================================================

create table if not exists clinic.orcamentos (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references clinic.pacientes (id) on delete cascade,
  prontuario_id uuid,
  data_emissao date not null default current_date,
  data_validade date,
  status text not null default 'rascunho' check (
    status in ('rascunho', 'enviado', 'aceito', 'rejeitado', 'convertido_em_fatura')
  ),
  valor_total numeric(10, 2) not null default 0,
  desconto_tipo text check (desconto_tipo in ('percentual', 'fixo')),
  desconto_valor numeric(10, 2) not null default 0,
  observacoes text,
  criado_por uuid,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_clinic_orcamentos_paciente
  on clinic.orcamentos (paciente_id);

create index if not exists idx_clinic_orcamentos_prontuario
  on clinic.orcamentos (prontuario_id);

create index if not exists idx_clinic_orcamentos_status
  on clinic.orcamentos (status);

create index if not exists idx_clinic_orcamentos_data
  on clinic.orcamentos (data_emissao);

create trigger touch_clinic_orcamentos_updated_at
  before update on clinic.orcamentos
  for each row
  execute function clinic.touch_updated_at();

create table if not exists clinic.orcamento_itens (
  id uuid primary key default gen_random_uuid(),
  orcamento_id uuid not null references clinic.orcamentos (id) on delete cascade,
  tratamento_id uuid,
  servico_id uuid references clinic.servicos (id) on delete set null,
  descricao text not null,
  preco_unitario numeric(10, 2) not null,
  quantidade integer not null default 1,
  subtotal numeric(10, 2) generated always as (preco_unitario * quantidade) stored,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_clinic_orcamento_itens_orcamento
  on clinic.orcamento_itens (orcamento_id);

create table if not exists clinic.faturas (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references clinic.pacientes (id) on delete cascade,
  prontuario_id uuid,
  orcamento_id uuid references clinic.orcamentos (id) on delete set null,
  numero_nf text unique,
  data_emissao date not null default current_date,
  data_vencimento date,
  status text not null default 'rascunho' check (
    status in ('rascunho', 'emitida', 'parcialmente_paga', 'paga', 'cancelada')
  ),
  valor_total numeric(10, 2) not null default 0,
  valor_pago numeric(10, 2) not null default 0,
  desconto_tipo text check (desconto_tipo in ('percentual', 'fixo')),
  desconto_valor numeric(10, 2) not null default 0,
  observacoes text,
  metodo_pagamento_default text,
  criado_por uuid,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_clinic_faturas_paciente
  on clinic.faturas (paciente_id);

create index if not exists idx_clinic_faturas_prontuario
  on clinic.faturas (prontuario_id);

create index if not exists idx_clinic_faturas_status
  on clinic.faturas (status);

create index if not exists idx_clinic_faturas_data
  on clinic.faturas (data_emissao);

create index if not exists idx_clinic_faturas_numero
  on clinic.faturas (numero_nf);

create trigger touch_clinic_faturas_updated_at
  before update on clinic.faturas
  for each row
  execute function clinic.touch_updated_at();

create table if not exists clinic.fatura_itens (
  id uuid primary key default gen_random_uuid(),
  fatura_id uuid not null references clinic.faturas (id) on delete cascade,
  tratamento_id uuid,
  servico_id uuid references clinic.servicos (id) on delete set null,
  descricao text not null,
  preco_unitario numeric(10, 2) not null,
  quantidade integer not null default 1,
  subtotal numeric(10, 2) generated always as (preco_unitario * quantidade) stored,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_clinic_fatura_itens_fatura
  on clinic.fatura_itens (fatura_id);

create table if not exists clinic.pagamentos (
  id uuid primary key default gen_random_uuid(),
  fatura_id uuid not null references clinic.faturas (id) on delete cascade,
  valor numeric(10, 2) not null,
  data_pagamento date not null default current_date,
  metodo_pagamento text not null check (
    metodo_pagamento in ('dinheiro', 'pix', 'cartao_credito', 'transferencia', 'cheque', 'outro')
  ),
  referencia text,
  notas text,
  registrado_por uuid,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_clinic_pagamentos_fatura
  on clinic.pagamentos (fatura_id);

create index if not exists idx_clinic_pagamentos_data
  on clinic.pagamentos (data_pagamento);

create index if not exists idx_clinic_pagamentos_metodo
  on clinic.pagamentos (metodo_pagamento);

create table if not exists clinic.cupons_desconto (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  descricao text,
  tipo text not null check (tipo in ('percentual', 'fixo')),
  valor numeric(10, 2) not null,
  validade_inicio date not null default current_date,
  validade_fim date,
  uso_maximo integer,
  uso_atual integer not null default 0,
  ativo boolean not null default true,
  criado_por uuid,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_clinic_cupons_codigo
  on clinic.cupons_desconto (codigo);

create index if not exists idx_clinic_cupons_ativo
  on clinic.cupons_desconto (ativo);

create index if not exists idx_clinic_cupons_validade
  on clinic.cupons_desconto (validade_fim);

create trigger touch_clinic_cupons_desconto_updated_at
  before update on clinic.cupons_desconto
  for each row
  execute function clinic.touch_updated_at();

create table if not exists clinic.cupom_uso (
  id uuid primary key default gen_random_uuid(),
  cupom_id uuid not null references clinic.cupons_desconto (id) on delete cascade,
  fatura_id uuid not null references clinic.faturas (id) on delete cascade,
  data_uso date not null default current_date,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_clinic_cupom_uso_cupom
  on clinic.cupom_uso (cupom_id);

create index if not exists idx_clinic_cupom_uso_fatura
  on clinic.cupom_uso (fatura_id);

alter table clinic.orcamentos enable row level security;
alter table clinic.orcamento_itens enable row level security;
alter table clinic.faturas enable row level security;
alter table clinic.fatura_itens enable row level security;
alter table clinic.pagamentos enable row level security;
alter table clinic.cupons_desconto enable row level security;
alter table clinic.cupom_uso enable row level security;

create policy "clinic_orcamentos_select_authenticated" on clinic.orcamentos
  for select using (auth.role() = 'authenticated');

create policy "clinic_orcamentos_insert_authenticated" on clinic.orcamentos
  for insert with check (auth.role() = 'authenticated');

create policy "clinic_orcamentos_update_authenticated" on clinic.orcamentos
  for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "clinic_orcamento_itens_select_authenticated" on clinic.orcamento_itens
  for select using (auth.role() = 'authenticated');

create policy "clinic_orcamento_itens_insert_authenticated" on clinic.orcamento_itens
  for insert with check (auth.role() = 'authenticated');

create policy "clinic_faturas_select_authenticated" on clinic.faturas
  for select using (auth.role() = 'authenticated');

create policy "clinic_faturas_insert_authenticated" on clinic.faturas
  for insert with check (auth.role() = 'authenticated');

create policy "clinic_faturas_update_authenticated" on clinic.faturas
  for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "clinic_fatura_itens_select_authenticated" on clinic.fatura_itens
  for select using (auth.role() = 'authenticated');

create policy "clinic_fatura_itens_insert_authenticated" on clinic.fatura_itens
  for insert with check (auth.role() = 'authenticated');

create policy "clinic_pagamentos_select_authenticated" on clinic.pagamentos
  for select using (auth.role() = 'authenticated');

create policy "clinic_pagamentos_insert_authenticated" on clinic.pagamentos
  for insert with check (auth.role() = 'authenticated');

create policy "clinic_cupons_select_authenticated" on clinic.cupons_desconto
  for select using (auth.role() = 'authenticated');

create policy "clinic_cupons_insert_authenticated" on clinic.cupons_desconto
  for insert with check (auth.role() = 'authenticated');

create policy "clinic_cupons_update_authenticated" on clinic.cupons_desconto
  for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "clinic_cupom_uso_select_authenticated" on clinic.cupom_uso
  for select using (auth.role() = 'authenticated');

create policy "clinic_cupom_uso_insert_authenticated" on clinic.cupom_uso
  for insert with check (auth.role() = 'authenticated');

create or replace function clinic.rpc_financeiro_resumo(
  p_data_inicio date,
  p_data_fim date,
  p_paciente_id uuid default null
)
returns table (
  periodo_inicio date,
  periodo_fim date,
  total_faturado numeric,
  total_recebido numeric,
  total_pendente numeric,
  total_vencido numeric,
  total_desconto_aplicado numeric,
  quantidade_faturas bigint,
  quantidade_faturas_pagas bigint,
  quantidade_faturas_pendentes bigint,
  taxa_recebimento numeric
)
language sql
stable
set search_path = clinic, public
as $$
  with filtered_faturas as (
    select
      f.id,
      f.data_vencimento,
      f.desconto_valor,
      f.status,
      f.valor_pago,
      f.valor_total
    from clinic.faturas f
    where f.data_emissao >= p_data_inicio
      and f.data_emissao <= p_data_fim
      and (p_paciente_id is null or f.paciente_id = p_paciente_id)
  ),
  filtered_pagamentos as (
    select
      p.valor
    from clinic.pagamentos p
    join clinic.faturas f on f.id = p.fatura_id
    where p.data_pagamento >= p_data_inicio
      and p.data_pagamento <= p_data_fim
      and (p_paciente_id is null or f.paciente_id = p_paciente_id)
  )
  select
    p_data_inicio as periodo_inicio,
    p_data_fim as periodo_fim,
    coalesce(sum(ff.valor_total), 0) as total_faturado,
    coalesce((select sum(fp.valor) from filtered_pagamentos fp), 0) as total_recebido,
    coalesce(sum(ff.valor_total - coalesce(ff.valor_pago, 0)), 0) as total_pendente,
    coalesce(
      sum(
        case
          when ff.data_vencimento is not null
            and ff.data_vencimento < current_date
            and ff.status in ('emitida', 'parcialmente_paga')
          then ff.valor_total - coalesce(ff.valor_pago, 0)
          else 0
        end
      ),
      0
    ) as total_vencido,
    coalesce(sum(coalesce(ff.desconto_valor, 0)), 0) as total_desconto_aplicado,
    count(*) as quantidade_faturas,
    count(*) filter (where ff.status = 'paga') as quantidade_faturas_pagas,
    count(*) filter (where ff.status <> 'paga') as quantidade_faturas_pendentes,
    case
      when coalesce(sum(ff.valor_total), 0) > 0
        then (
          coalesce((select sum(fp.valor) from filtered_pagamentos fp), 0)
          / sum(ff.valor_total)
        ) * 100
      else 0
    end as taxa_recebimento
  from filtered_faturas ff;
$$;

create or replace function clinic.rpc_financeiro_devedores(
  p_limit integer default 20,
  p_paciente_id uuid default null
)
returns table (
  paciente_id uuid,
  nome text,
  email text,
  telefone text,
  total_devido numeric,
  dias_atraso integer,
  quantidade_faturas_vencidas bigint
)
language sql
stable
set search_path = clinic, public
as $$
  with overdue_faturas as (
    select
      f.data_vencimento,
      f.paciente_id,
      (f.valor_total - coalesce(f.valor_pago, 0)) as saldo
    from clinic.faturas f
    where f.status in ('emitida', 'parcialmente_paga')
      and f.data_vencimento is not null
      and f.data_vencimento < current_date
      and (p_paciente_id is null or f.paciente_id = p_paciente_id)
  )
  select
    p.id as paciente_id,
    p.nome,
    p.email,
    p.telefone,
    coalesce(sum(of.saldo), 0) as total_devido,
    coalesce(max(current_date - of.data_vencimento), 0)::integer as dias_atraso,
    count(*) as quantidade_faturas_vencidas
  from overdue_faturas of
  join clinic.pacientes p on p.id = of.paciente_id
  group by p.id, p.nome, p.email, p.telefone
  order by total_devido desc
  limit greatest(coalesce(p_limit, 20), 1);
$$;
