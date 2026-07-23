-- ============================================================================
-- Clinic operational RPCs for the n8n migration
-- ============================================================================

drop function if exists clinic.confirmar_solicitacao_agendamento(uuid, timestamptz, uuid, uuid, text, uuid);
drop function if exists clinic.remarcar_solicitacao_agendamento(uuid, text, timestamptz, uuid, uuid);
drop function if exists clinic.cancelar_solicitacao_agendamento(uuid, text);

create or replace function clinic.confirmar_solicitacao_agendamento(
  p_solicitacao_id uuid,
  p_data_hora timestamptz,
  p_profissional_id uuid,
  p_servico_id uuid,
  p_observacoes_admin text default null,
  p_paciente_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = clinic, public
as $$
declare
  v_solicitacao clinic.solicitacoes_agendamento%rowtype;
  v_agendamento_id uuid;
  v_paciente_id uuid;
  v_data_hora_local timestamp;
  v_duracao_minutos integer;
  v_observacoes_admin_atuais text;
  v_observacoes_admin_novas text;
  v_observacoes_agendamento text;
  v_nota_automatica text;
begin
  if p_data_hora is null then
    raise exception 'Informe a data e hora do agendamento.';
  end if;

  if p_profissional_id is null then
    raise exception 'Informe o profissional do agendamento.';
  end if;

  if p_servico_id is null then
    raise exception 'Informe o servico do agendamento.';
  end if;

  if p_data_hora <= now() then
    raise exception 'A data do agendamento precisa estar no futuro.';
  end if;

  select *
  into v_solicitacao
  from clinic.solicitacoes_agendamento
  where id = p_solicitacao_id
  for update;

  if not found then
    raise exception 'Solicitacao nao encontrada.';
  end if;

  v_data_hora_local := timezone('America/Sao_Paulo', p_data_hora);
  v_observacoes_admin_atuais := nullif(trim(coalesce(v_solicitacao.observacoes_admin, '')), '');
  v_observacoes_admin_novas := nullif(trim(coalesce(p_observacoes_admin, '')), '');

  if v_observacoes_admin_novas is not null and v_observacoes_admin_novas = v_observacoes_admin_atuais then
    v_observacoes_admin_novas := null;
  end if;

  v_paciente_id := coalesce(p_paciente_id, v_solicitacao.paciente_id);

  if v_paciente_id is null and nullif(trim(coalesce(v_solicitacao.telefone_cliente, '')), '') is not null then
    select p.id
    into v_paciente_id
    from clinic.pacientes p
    where clinic.normalize_phone(p.telefone) = clinic.normalize_phone(v_solicitacao.telefone_cliente)
    order by p.updated_at desc, p.created_at desc
    limit 1;
  end if;

  if v_paciente_id is null then
    insert into clinic.pacientes (
      nome,
      telefone,
      telefone_normalizado,
      observacoes,
      ativo
    )
    values (
      coalesce(nullif(trim(v_solicitacao.nome_cliente), ''), 'Paciente sem nome'),
      nullif(trim(coalesce(v_solicitacao.telefone_cliente, '')), ''),
      clinic.normalize_phone(v_solicitacao.telefone_cliente),
      concat(
        'Paciente criado automaticamente a partir da solicitacao ',
        coalesce(v_solicitacao.codigo_externo, v_solicitacao.id::text),
        '.'
      ),
      true
    )
    returning id into v_paciente_id;
  end if;

  select s.duracao_minutos
  into v_duracao_minutos
  from clinic.servicos s
  where s.id = p_servico_id;

  v_nota_automatica := concat(
    '[Confirmacao registrada em ',
    to_char(timezone('America/Sao_Paulo', now()), 'DD/MM/YYYY HH24:MI'),
    '] Agendamento confirmado para ',
    to_char(v_data_hora_local, 'DD/MM/YYYY HH24:MI'),
    '.'
  );

  v_observacoes_agendamento := concat_ws(
    E'\n\n',
    nullif(trim(coalesce(v_solicitacao.observacoes_cliente, '')), ''),
    v_observacoes_admin_novas
  );

  if v_solicitacao.agendamento_id is null then
    insert into clinic.agendamentos (
      paciente_id,
      profissional_id,
      servico_id,
      data_hora,
      duracao_minutos,
      status,
      origem,
      observacoes
    )
    values (
      v_paciente_id,
      p_profissional_id,
      p_servico_id,
      p_data_hora,
      v_duracao_minutos,
      'confirmado',
      coalesce(nullif(trim(coalesce(v_solicitacao.origem, '')), ''), 'solicitacao'),
      v_observacoes_agendamento
    )
    returning id into v_agendamento_id;
  else
    update clinic.agendamentos
    set
      paciente_id = v_paciente_id,
      profissional_id = p_profissional_id,
      servico_id = p_servico_id,
      data_hora = p_data_hora,
      duracao_minutos = coalesce(v_duracao_minutos, duracao_minutos),
      status = 'confirmado',
      origem = coalesce(nullif(trim(coalesce(v_solicitacao.origem, '')), ''), origem),
      observacoes = concat_ws(
        E'\n\n',
        nullif(trim(coalesce(observacoes, '')), ''),
        v_observacoes_agendamento
      ),
      updated_at = now()
    where id = v_solicitacao.agendamento_id
    returning id into v_agendamento_id;
  end if;

  update clinic.solicitacoes_agendamento
  set
    agendamento_id = v_agendamento_id,
    paciente_id = v_paciente_id,
    profissional_id = p_profissional_id,
    servico_id = p_servico_id,
    data_hora_confirmada = p_data_hora,
    dia_desejado = v_data_hora_local::date,
    horario_desejado = v_data_hora_local::time,
    status = 'agendado',
    observacoes_admin = concat_ws(
      E'\n\n',
      v_observacoes_admin_atuais,
      v_observacoes_admin_novas,
      v_nota_automatica
    ),
    updated_at = now()
  where id = p_solicitacao_id;

  insert into clinic.atividades (tipo, titulo, descricao, referencia_id)
  values (
    'solicitacao_confirmada',
    'Solicitacao confirmada',
    concat(
      v_solicitacao.nome_cliente,
      ' foi agendado(a) para ',
      to_char(v_data_hora_local, 'DD/MM HH24:MI'),
      '.'
    ),
    p_solicitacao_id::text
  );

  return v_agendamento_id::text;
end;
$$;

create or replace function clinic.remarcar_solicitacao_agendamento(
  p_solicitacao_id uuid,
  p_observacoes_admin text default null,
  p_data_hora timestamptz default null,
  p_profissional_id uuid default null,
  p_servico_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = clinic, public
as $$
declare
  v_solicitacao clinic.solicitacoes_agendamento%rowtype;
  v_data_hora_anterior timestamptz;
  v_data_hora_local timestamp;
  v_descricao_atividade text;
  v_nota_automatica text;
  v_horario_desejado clinic.solicitacoes_agendamento.horario_desejado%type;
  v_vai_atualizar_agendamento boolean;
begin
  select *
  into v_solicitacao
  from clinic.solicitacoes_agendamento
  where id = p_solicitacao_id
  for update;

  if not found then
    raise exception 'Solicitacao nao encontrada.';
  end if;

  if p_data_hora is not null and p_data_hora <= now() then
    raise exception 'A nova data precisa estar no futuro.';
  end if;

  select a.data_hora
  into v_data_hora_anterior
  from clinic.agendamentos a
  where a.id = v_solicitacao.agendamento_id;

  v_data_hora_anterior := coalesce(v_solicitacao.data_hora_confirmada, v_data_hora_anterior);
  v_nota_automatica := null;

  if p_data_hora is not null then
    v_data_hora_local := timezone('America/Sao_Paulo', p_data_hora);
    v_horario_desejado := v_data_hora_local::time;
  else
    v_horario_desejado := v_solicitacao.horario_desejado;
  end if;

  v_vai_atualizar_agendamento := v_solicitacao.agendamento_id is not null
    and (
      p_data_hora is not null
      or p_profissional_id is not null
      or p_servico_id is not null
    );

  if v_vai_atualizar_agendamento then
    update clinic.agendamentos
    set
      data_hora = coalesce(p_data_hora, data_hora),
      profissional_id = coalesce(p_profissional_id, profissional_id),
      servico_id = coalesce(p_servico_id, servico_id),
      updated_at = now()
    where id = v_solicitacao.agendamento_id;
  end if;

  v_nota_automatica := case
    when p_data_hora is not null then
      concat(
        '[Remarcacao registrada em ',
        to_char(timezone('America/Sao_Paulo', now()), 'DD/MM/YYYY HH24:MI'),
        '] Data anterior: ',
        coalesce(to_char(timezone('America/Sao_Paulo', v_data_hora_anterior), 'DD/MM/YYYY HH24:MI'), 'nao informada'),
        '. Nova data proposta: ',
        to_char(v_data_hora_local, 'DD/MM/YYYY HH24:MI'),
        case
          when v_vai_atualizar_agendamento then '. Agendamento vinculado atualizado.'
          else '.'
        end
      )
    else
      concat(
        '[Remarcacao registrada em ',
        to_char(timezone('America/Sao_Paulo', now()), 'DD/MM/YYYY HH24:MI'),
        '] Remarcacao solicitada sem nova data definida.',
        case
          when v_vai_atualizar_agendamento then ' Agendamento vinculado atualizado.'
          else ''
        end
      )
  end;

  update clinic.solicitacoes_agendamento
  set
    data_hora_confirmada = coalesce(p_data_hora, data_hora_confirmada),
    dia_desejado = case
      when p_data_hora is not null then v_data_hora_local::date
      else dia_desejado
    end,
    observacoes_admin = concat_ws(
      E'\n\n',
      nullif(trim(coalesce(v_solicitacao.observacoes_admin, '')), ''),
      nullif(trim(coalesce(p_observacoes_admin, '')), ''),
      v_nota_automatica
    ),
    profissional_id = coalesce(p_profissional_id, profissional_id),
    servico_id = coalesce(p_servico_id, servico_id),
    status = case
      when p_data_hora is not null then 'aguardando_confirmacao'
      else 'remarcacao_solicitada'
    end,
    horario_desejado = case
      when p_data_hora is not null then v_horario_desejado
      else horario_desejado
    end,
    updated_at = now()
  where id = p_solicitacao_id;

  v_descricao_atividade := case
    when p_data_hora is not null then
      concat(
        v_solicitacao.nome_cliente,
        ' recebeu nova proposta para ',
        to_char(v_data_hora_local, 'DD/MM HH24:MI'),
        '.'
      )
    else
      concat(v_solicitacao.nome_cliente, ' entrou em remarcacao sem nova data definida.')
  end;

  insert into clinic.atividades (tipo, titulo, descricao, referencia_id)
  values (
    'solicitacao_remarcacao',
    'Solicitacao remarcada',
    v_descricao_atividade,
    p_solicitacao_id::text
  );

  return p_solicitacao_id::text;
end;
$$;

create or replace function clinic.cancelar_solicitacao_agendamento(
  p_solicitacao_id uuid,
  p_observacoes_admin text default null
)
returns text
language plpgsql
security definer
set search_path = clinic, public
as $$
declare
  v_solicitacao clinic.solicitacoes_agendamento%rowtype;
  v_nota_automatica text;
begin
  select *
  into v_solicitacao
  from clinic.solicitacoes_agendamento
  where id = p_solicitacao_id
  for update;

  if not found then
    raise exception 'Solicitacao nao encontrada.';
  end if;

  v_nota_automatica := concat(
    '[Cancelamento registrado em ',
    to_char(timezone('America/Sao_Paulo', now()), 'DD/MM/YYYY HH24:MI'),
    '] Solicitacao cancelada.'
  );

  if v_solicitacao.agendamento_id is not null then
    update clinic.agendamentos
    set
      status = 'cancelado',
      updated_at = now()
    where id = v_solicitacao.agendamento_id;
  end if;

  update clinic.solicitacoes_agendamento
  set
    status = 'cancelado',
    observacoes_admin = concat_ws(
      E'\n\n',
      nullif(trim(coalesce(v_solicitacao.observacoes_admin, '')), ''),
      nullif(trim(coalesce(p_observacoes_admin, '')), ''),
      v_nota_automatica
    ),
    updated_at = now()
  where id = p_solicitacao_id;

  insert into clinic.atividades (tipo, titulo, descricao, referencia_id)
  values (
    'solicitacao_cancelada',
    'Solicitacao cancelada',
    concat(v_solicitacao.nome_cliente, ' teve a solicitacao cancelada.'),
    p_solicitacao_id::text
  );

  return p_solicitacao_id::text;
end;
$$;
