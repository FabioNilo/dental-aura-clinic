drop function if exists public.confirmar_solicitacao_agendamento(uuid, text, timestamptz, uuid, uuid);
drop function if exists public.confirmar_solicitacao_agendamento(uuid, text, timestamptz, uuid, uuid, uuid);

create or replace function public.confirmar_solicitacao_agendamento(
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
set search_path = public
as $$
declare
  v_solicitacao public.solicitacoes_agendamento%rowtype;
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
  from public.solicitacoes_agendamento
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
    from public.pacientes p
    where regexp_replace(coalesce(p.telefone, ''), '\D', '', 'g')
      = regexp_replace(coalesce(v_solicitacao.telefone_cliente, ''), '\D', '', 'g')
    order by p.updated_at desc, p.created_at desc
    limit 1;
  end if;

  if v_paciente_id is null then
    insert into public.pacientes (
      nome,
      telefone,
      observacoes,
      ativo
    )
    values (
      coalesce(nullif(trim(v_solicitacao.nome_cliente), ''), 'Paciente sem nome'),
      nullif(trim(coalesce(v_solicitacao.telefone_cliente, '')), ''),
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
  from public.servicos s
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
    insert into public.agendamentos (
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
    update public.agendamentos
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

  update public.solicitacoes_agendamento
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

  insert into public.atividades (tipo, titulo, descricao, referencia_id)
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
