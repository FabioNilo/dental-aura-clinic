insert into public.servicos (nome, descricao, duracao_minutos, preco, ativo)
select
  seed.nome,
  seed.descricao,
  seed.duracao_minutos,
  seed.preco,
  true
from (
  values
    ('Consulta geral', 'Avaliacao inicial e orientacao clinica.', 60, 180.00),
    ('Limpeza', 'Profilaxia e remocao de placa bacteriana.', 50, 160.00),
    ('Urgencia odontologica', 'Atendimento para dor ou intercorrencia aguda.', 45, 220.00),
    ('Avaliacao ortodontica', 'Consulta para analise de alinhamento e planejamento.', 60, 200.00),
    ('Clareamento dental', 'Sessao de clareamento supervisionado em consultorio.', 90, 450.00),
    ('Retorno clinico', 'Reavaliacao apos procedimento ou acompanhamento.', 30, 120.00)
) as seed(nome, descricao, duracao_minutos, preco)
where not exists (
  select 1
  from public.servicos s
  where lower(s.nome) = lower(seed.nome)
);
