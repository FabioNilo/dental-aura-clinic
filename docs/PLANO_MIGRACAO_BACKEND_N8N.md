# Plano de Migracao de Backend para n8n

## Objetivo

Preparar a migracao gradual do `dental-aura-clinic` para uma arquitetura onde o n8n passa a ser a camada principal de orquestracao de dados e automacoes, reduzindo a dependencia do Supabase como backend operacional final.

Nesta fase, o foco e:

- entender o schema atual como referencia real
- prever um schema proprio para o projeto
- mapear as tabelas necessarias por dominio
- definir a ordem de migracao com menor impacto
- preservar o contrato atual enquanto a transicao acontece

## Corte iniciado no repositorio

O primeiro passo da migracao ja foi iniciado com:

- bridge de login via n8n com fallback para Supabase
- workflow de login administrativo via n8n
- primeira migration do schema `clinic`
- tabela `clinic.access_roles` para preparar a autenticacao fora do `public.user_roles`
- tabelas operacionais iniciais para atender solicitacoes, conversas e integracoes
- RPCs operacionais em `clinic` para confirmar, remarcar, cancelar e criar pacientes por telefone
- base financeira em `clinic` com `orcamentos`, `orcamento_itens`, `faturas`, `fatura_itens`, `pagamentos`, `cupons_desconto` e `cupom_uso`
- base clinica em `clinic` com `prontuarios` e `tratamentos`
- helper de fallback no front para tentar `clinic` primeiro e manter compatibilidade com `public`

### Estrutura de workflows no n8n

A organizacao oficial dos workflows passa a ser:

- `dental/00-infra`
- `dental/clientes`
- `dental/atendimentos`
- `dental/clinico`
- `dental/faturamento`
- `dental/admin`
- `dental/integracoes`
- `dental/arquivados`

O padrao de nomeacao de cada workflow fica:

- `AREA - acao - v1`

Os workflows ja prontos foram espelhados em:

- `n8n/dental/admin/ADMIN - login.json`
- `n8n/dental/atendimentos/ATD - captura whatsapp.json`

O contrato do login via n8n precisa devolver uma sessao compatível com o cliente atual do Supabase, com pelo menos:

- `access_token`
- `refresh_token`
- `user`

O workflow de referencia ficou documentado em:

- `Login Admin Ajuste.json`
- `docs/n8n-login-admin-clinica-v1.md`

## Premissas

- O banco atual do projeto continua como referencia funcional.
- Nao mexer no schema `psinote` nesta etapa.
- O Supabase permanece ativo no curto prazo para nao quebrar o app.
- O n8n deve entrar primeiro como camada de entrada, integracao e orquestracao.
- A troca completa de backend deve acontecer em fases, nao em um corte unico.

## Base atual observada no repositorio

O projeto hoje ja possui estes dominios consolidados:

- operacao geral: `pacientes`, `profissionais`, `servicos`, `agendamentos`, `solicitacoes_agendamento`, `atividades`, `user_roles`
- clinico: `prontuarios`, `tratamentos`
- financeiro: `orcamentos`, `orcamento_itens`, `faturas`, `fatura_itens`, `pagamentos`, `cupons_desconto`, `cupom_uso`

O contrato atual do n8n ja aponta para:

- localizar ou criar paciente pelo telefone
- salvar solicitacao em `clinic.solicitacoes_agendamento`
- nao criar `agendamentos` automaticamente

## Proposta de schema proprio

Recomendacao principal: criar um schema do projeto, por exemplo `clinic`, mantendo os nomes de tabela que o time ja conhece.

Isso reduz retrabalho e facilita a migracao do front e do n8n.

### Schema sugerido

- `clinic_core`
- `clinic_ops`
- `clinic_clinical`
- `clinic_finance`
- `clinic_integration`

### Estrutura recomendada por dominio

#### `clinic_core`

- `pacientes`
- `profissionais`
- `servicos`
- `access_roles`
- `clinic_settings`

#### `clinic_ops`

- `solicitacoes_agendamento`
- `agendamentos`
- `atividades`
- `conversas_atendimento`
- `mensagens_atendimento`
- `agenda_bloqueios`

#### `clinic_clinical`

- `prontuarios`
- `tratamentos`

#### `clinic_finance`

- `orcamentos`
- `orcamento_itens`
- `faturas`
- `fatura_itens`
- `pagamentos`
- `cupons_desconto`
- `cupom_uso`

#### `clinic_integration`

- `integration_webhook_inbox`
- `integration_outbox`
- `workflow_runs`
- `sync_state`

## Tabelas necessarias

### 1. `pacientes`

Base mestre de clientes/pacientes.

Campos principais:

- `id`
- `nome`
- `cpf`
- `telefone`
- `email`
- `data_nascimento`
- `endereco`
- `observacoes`
- `ativo`
- `created_at`
- `updated_at`

### 2. `profissionais`

Cadastro da equipe clinica.

Campos principais:

- `id`
- `nome`
- `especialidade`
- `cro`
- `telefone`
- `email`
- `ativo`
- `created_at`
- `updated_at`

### 3. `servicos`

Tabela de catalogo e preco.

Campos principais:

- `id`
- `nome`
- `descricao`
- `categoria`
- `preco`
- `duracao_minutos`
- `ativo`
- `created_at`
- `updated_at`

### 4. `solicitacoes_agendamento`

Fila operacional do atendimento IA/n8n.

Campos principais:

- `id`
- `codigo_externo`
- `status`
- `origem`
- `canal_origem`
- `paciente_id`
- `agendamento_id`
- `profissional_id`
- `servico_id`
- `nome_cliente`
- `telefone_cliente`
- `procedimento_nome`
- `tipo_atendimento`
- `dia_desejado`
- `horario_desejado`
- `data_hora_confirmada`
- `observacoes_cliente`
- `observacoes_admin`
- `payload_externo`
- `resumo_atendimento`
- `created_at`
- `updated_at`

### 5. `conversas_atendimento`

Cadastro da conversa por telefone/canal, para manter contexto e historico.

Campos principais:

- `id`
- `paciente_id`
- `telefone_normalizado`
- `canal`
- `status`
- `ultima_mensagem_em`
- `metadata`
- `created_at`
- `updated_at`

### 6. `mensagens_atendimento`

Log bruto das mensagens recebidas e enviadas.

Campos principais:

- `id`
- `conversa_id`
- `direcao`
- `conteudo`
- `payload_bruto`
- `external_message_id`
- `tipo_mensagem`
- `created_at`

### 7. `agendamentos`

Agenda oficial confirmada.

Campos principais:

- `id`
- `paciente_id`
- `profissional_id`
- `servico_id`
- `data_hora`
- `duracao_minutos`
- `status`
- `origem`
- `observacoes`
- `created_at`
- `updated_at`

### 8. `atividades`

Auditoria operacional simplificada.

Campos principais:

- `id`
- `tipo`
- `titulo`
- `descricao`
- `referencia_id`
- `created_at`

### 9. `prontuarios`

Ficha clinica de atendimento.

Campos principais:

- `id`
- `paciente_id`
- `agendamento_id`
- `profissional_id`
- `profissional_nome`
- `data_consulta`
- `queixa_principal`
- `historico_doencas`
- `alergias`
- `medicacoes_atuais`
- `exame_fisico`
- `diagnostico`
- `conduta`
- `observacoes_gerais`
- `created_at`
- `updated_at`

### 10. `tratamentos`

Plano terapeutico e evolucao.

Campos principais:

- `id`
- `prontuario_id`
- `paciente_id`
- `servico_id`
- `servico_nome`
- `dente_numero`
- `procedimento_descricao`
- `status`
- `data_diagnostico`
- `data_orcamento`
- `data_prevista`
- `num_sessoes_total`
- `num_sessoes_realizadas`
- `notas_sessao`
- `created_at`
- `updated_at`

### 11. Financeiro

#### `orcamentos`

- `id`
- `paciente_id`
- `prontuario_id`
- `data_emissao`
- `data_validade`
- `status`
- `valor_total`
- `desconto_tipo`
- `desconto_valor`
- `observacoes`
- `criado_por`
- `created_at`
- `updated_at`

#### `orcamento_itens`

- `id`
- `orcamento_id`
- `tratamento_id`
- `servico_id`
- `descricao`
- `preco_unitario`
- `quantidade`
- `subtotal`
- `created_at`

#### `faturas`

- `id`
- `paciente_id`
- `prontuario_id`
- `orcamento_id`
- `numero_nf`
- `data_emissao`
- `data_vencimento`
- `status`
- `valor_total`
- `valor_pago`
- `desconto_tipo`
- `desconto_valor`
- `observacoes`
- `metodo_pagamento_default`
- `criado_por`
- `created_at`
- `updated_at`

#### `fatura_itens`

- `id`
- `fatura_id`
- `tratamento_id`
- `servico_id`
- `descricao`
- `preco_unitario`
- `quantidade`
- `subtotal`
- `created_at`

#### `pagamentos`

- `id`
- `fatura_id`
- `valor`
- `data_pagamento`
- `metodo_pagamento`
- `referencia`
- `notas`
- `registrado_por`
- `created_at`

#### `cupons_desconto`

- `id`
- `codigo`
- `descricao`
- `tipo`
- `valor`
- `validade_inicio`
- `validade_fim`
- `uso_maximo`
- `uso_atual`
- `ativo`
- `criado_por`
- `created_at`
- `updated_at`

#### `cupom_uso`

- `id`
- `cupom_id`
- `fatura_id`
- `data_uso`
- `created_at`

### 12. Integração

#### `integration_webhook_inbox`

- `id`
- `source`
- `event_type`
- `external_id`
- `payload`
- `received_at`
- `processed_at`
- `status`
- `error_message`

#### `integration_outbox`

- `id`
- `topic`
- `aggregate_type`
- `aggregate_id`
- `payload`
- `status`
- `retry_count`
- `next_retry_at`
- `created_at`
- `processed_at`

#### `workflow_runs`

- `id`
- `workflow_key`
- `trigger_source`
- `status`
- `input_payload`
- `output_payload`
- `error_message`
- `started_at`
- `finished_at`

#### `sync_state`

- `id`
- `integration_name`
- `cursor_value`
- `last_synced_at`
- `metadata`

#### `clinic_settings`

- `id`
- `setting_key`
- `setting_value`
- `scope`
- `created_at`
- `updated_at`

## Mapa atual -> novo

### Manter quase igual, mudando o schema

- `public.pacientes` -> `clinic_core.pacientes`
- `public.profissionais` -> `clinic_core.profissionais`
- `public.servicos` -> `clinic_core.servicos`
- `public.solicitacoes_agendamento` -> `clinic_ops.solicitacoes_agendamento`
- `public.agendamentos` -> `clinic_ops.agendamentos`
- `public.atividades` -> `clinic_ops.atividades`
- `public.prontuarios` -> `clinic_clinical.prontuarios`
- `public.tratamentos` -> `clinic_clinical.tratamentos`
- `public.orcamentos` -> `clinic_finance.orcamentos`
- `public.orcamento_itens` -> `clinic_finance.orcamento_itens`
- `public.faturas` -> `clinic_finance.faturas`
- `public.fatura_itens` -> `clinic_finance.fatura_itens`
- `public.pagamentos` -> `clinic_finance.pagamentos`
- `public.cupons_desconto` -> `clinic_finance.cupons_desconto`
- `public.cupom_uso` -> `clinic_finance.cupom_uso`

### Novas tabelas que valem o esforço

- `conversas_atendimento`
- `mensagens_atendimento`
- `integration_webhook_inbox`
- `integration_outbox`
- `workflow_runs`
- `sync_state`
- `clinic_settings`
- `agenda_bloqueios`

## Regras de relacionamento recomendadas

- `solicitacoes_agendamento.paciente_id` deve apontar para `pacientes.id`
- `agendamentos.paciente_id` deve apontar para `pacientes.id`
- `agendamentos.profissional_id` deve apontar para `profissionais.id`
- `agendamentos.servico_id` deve apontar para `servicos.id`
- `prontuarios.agendamento_id` deve apontar para `agendamentos.id`
- `tratamentos.prontuario_id` deve apontar para `prontuarios.id`
- `orcamentos.prontuario_id` deve apontar para `prontuarios.id`
- `faturas.orcamento_id` deve apontar para `orcamentos.id`
- `pagamentos.fatura_id` deve apontar para `faturas.id`
- `cupom_uso.cupom_id` deve apontar para `cupons_desconto.id`
- `cupom_uso.fatura_id` deve apontar para `faturas.id`

## Ordem de migracao sugerida

### Fase 0 - Inventario e congelamento

- validar o schema atual com base nas migrations do repositorio
- mapear o que o front realmente usa
- registrar funcoes RPC que precisam continuar existindo
- congelar contratos antes de mover tabelas

### Fase 1 - Schema base

- criar schema novo
- criar `pacientes`, `profissionais`, `servicos`
- criar `clinic_settings`
- criar indexes e chaves primarias
- definir estrategia de RLS e service role

### Fase 2 - Operacao

- criar `solicitacoes_agendamento`
- criar `agendamentos`
- criar `atividades`
- criar `conversas_atendimento`
- criar `mensagens_atendimento`

### Fase 3 - Clinico

- consolidar `clinic.prontuarios` e `clinic.tratamentos`
- adaptar os componentes de prontuario para ler e escrever no novo schema
- manter fallback para `public` durante a transicao

### Fase 4 - Financeiro

- consolidar `clinic.orcamentos`, `clinic.orcamento_itens`, `clinic.faturas`, `clinic.fatura_itens`, `clinic.pagamentos`, `clinic.cupons_desconto` e `clinic.cupom_uso`
- garantir RPCs de resumo e devedores no novo schema
- migrar relatórios e views com fallback temporario para `public`
- validar permissões e RLS por perfil de acesso

### Fase 5 - Integração n8n

- transformar insercoes diretas em workflows controlados
- manter o login administrativo no n8n como primeira porta de entrada do painel
- adicionar idempotencia com inbox/outbox
- monitorar execucao de fluxos

### Fase 6 - Corte

- trocar o frontend para o novo schema
- desligar dependencias antigas por etapas
- manter views ou RPC wrappers para compatibilidade temporaria

## Recomendacao tecnica para reduzir esforço

O melhor caminho nao e reescrever tudo de uma vez. E:

1. criar o novo schema com a mesma semantica das tabelas atuais
2. manter views/aliases temporarios para o que o front ja consome
3. mover o n8n primeiro para escrita controlada
4. migrar depois o frontend para o novo contrato
5. remover o Supabase como dependencia primaria somente no final

Estado atual:

- login administrativo ja tem ponte n8n + Supabase
- atendimento ja prioriza `clinic` com fallback
- prontuario clinico ja prioriza `clinic` com fallback
- financeiro ja prioriza `clinic` com fallback
- o proximo corte seguro e ampliar escrita/leituras diretas do n8n para o novo schema

## Riscos principais

- duplicidade de escrita durante a transicao
- contratos do front quebrando por divergencia de nomes
- RPCs antigas ficando incompatíveis
- falta de rastreabilidade entre evento recebido e registro salvo
- dificuldade de reconciliação se a troca de backend for feita em bloco unico

## Mitigacoes

- manter o schema antigo enquanto o novo entra
- usar views compatíveis durante a fase de transição
- registrar eventos de entrada e saida
- adotar ids externos e validacao de idempotencia
- migrar modulo por modulo, com testes entre as etapas

## Primeiro passo pratico

1. Criar o schema novo e as tabelas base de `pacientes`, `profissionais`, `servicos`, `solicitacoes_agendamento` e `agendamentos`.
2. Criar `conversas_atendimento` e `mensagens_atendimento` para o historico do WhatsApp.
3. Reimplementar o fluxo do n8n com escrita nesse novo schema.
4. Depois disso, migrar o financeiro.
