# Etapa 1: Expansao do Atendimento com n8n

## Objetivo

Estruturar o primeiro modulo operacional da clinica para atendimento com IA via WhatsApp, sem automatizar a agenda final neste primeiro momento.

Nesta etapa, a IA:

- tira duvidas
- identifica o paciente pelo telefone
- cria o paciente se ele ainda nao existir
- coleta dados basicos da solicitacao
- salva a solicitacao no banco

O admin:

- revisa a solicitacao
- confirma, remarca ou cancela manualmente
- transforma a solicitacao em agendamento oficial

## Direcao recomendada

O melhor ponto de partida para esse projeto e tratar o n8n como a porta de entrada do atendimento, mas nao como a camada final de agendamento.

Fluxo:

1. Paciente entra pelo WhatsApp ou formulario do site.
2. A IA coleta os dados minimos do pedido de consulta.
3. O n8n grava uma solicitacao em `public.solicitacoes_agendamento`.
4. O admin avalia e confirma.
5. Quando confirmado, nasce o registro em `public.agendamentos`.

Essa abordagem evita conflito de agenda, reduz risco operacional e cria a base do CRM da clinica desde o primeiro contato.

## Tabela nova

A migration base esta em:

- [20260326110000_create_solicitacoes_agendamento.sql](/Users/cippa/OneDrive/Documentos/barrak/clinica/dental-aura-clinic/supabase/migrations/20260326110000_create_solicitacoes_agendamento.sql)

### Campos principais

- `id`: identificador interno
- `created_at`: data de entrada
- `updated_at`: ultima atualizacao
- `status`: estado operacional da solicitacao
- `origem`: origem do contato, como `whatsapp` ou `site`
- `canal_origem`: canal tecnico, como `n8n`
- `codigo_externo`: codigo legivel da solicitacao
- `paciente_id`: vinculo com paciente existente, quando houver
- `agendamento_id`: vinculo com agendamento confirmado
- `profissional_id`: profissional definido na confirmacao
- `servico_id`: servico selecionado
- `nome_cliente`: nome capturado no atendimento
- `telefone_cliente`: telefone principal
- `procedimento_nome`: nome livre do procedimento inicial
- `tipo_atendimento`: `particular` ou `convenio`
- `dia_desejado`: dia pedido pelo paciente
- `turno_desejado`: `manha`, `tarde`, `noite` ou `comercial`
- `data_hora_confirmada`: horario efetivamente confirmado
- `observacoes_cliente`: observacoes do paciente
- `observacoes_admin`: notas internas do time
- `payload_externo`: payload bruto do n8n ou do formulario
- `resumo_atendimento`: snapshot estruturado do atendimento

## Status recomendados

Os status da solicitacao foram definidos para cobrir o MVP e a expansao posterior:

- `novo`
- `em_triagem`
- `aguardando_confirmacao`
- `agendado`
- `remarcacao_solicitada`
- `cancelamento_solicitado`
- `cancelado`

## Como o n8n deve usar essa estrutura

No primeiro fluxo, a IA nao deve tentar fechar agenda automaticamente. Ela deve:

1. identificar o telefone do paciente
2. buscar o paciente em `pacientes`
3. se nao existir, criar em `pacientes`
4. coletar:
   - nome
   - telefone
   - procedimento: consulta geral
   - dia desejado
   - turno desejado
5. gerar um resumo tecnico
6. salvar em `solicitacoes_agendamento`
7. avisar que a equipe vai confirmar o horario

### Campos minimos para o primeiro fluxo

- `nome_cliente`
- `telefone_cliente`
- `procedimento_nome`
- `dia_desejado`
- `turno_desejado`
- `codigo_externo`
- `status = novo`
- `origem = whatsapp`
- `canal_origem = n8n`

## Como o admin deve funcionar

### Nova aba: Solicitacoes

Essa nova tela deve ser a primeira expansao do painel.

Elementos recomendados:

- busca por nome ou telefone
- filtro por status
- cards ou tabela com:
  - codigo
  - nome
  - telefone
  - procedimento
  - dia desejado
  - turno desejado
  - status
  - data de entrada

### Acoes por solicitacao

- `Confirmar`
- `Remarcar`
- `Cancelar`

### Ao confirmar

O admin deve escolher:

- profissional
- data
- hora

Depois disso:

1. criar registro em `agendamentos`
2. atualizar `solicitacoes_agendamento.status = agendado`
3. preencher `agendamento_id`
4. preencher `profissional_id`
5. preencher `data_hora_confirmada`

## Desenho do CRM inicial

Mesmo sem uma tela completa de historico de conversa, a tabela nova ja cria a base do CRM.

Cada telefone passa a ter:

- paciente
- origem do atendimento
- solicitacoes abertas
- solicitacoes confirmadas
- remarcacoes
- cancelamentos

Isso ja permite uma segunda etapa com:

- pipeline de pacientes
- reativacao automatica
- lembrete 24h antes
- fila de retorno

## Ordem ideal de implementacao

### Etapa 1A: Banco

- criar `solicitacoes_agendamento`
- definir indexes
- preparar codigo externo

### Etapa 1B: Admin

- criar aba `Solicitacoes`
- listar registros
- filtrar por status, nome e telefone
- permitir confirmar, remarcar e cancelar

### Etapa 1C: n8n

- fluxo de atendimento para consulta geral
- busca ou criacao de paciente
- gravacao da solicitacao no banco

### Etapa 1D: Confirmacao e lembrete

- envio de confirmacao depois da acao humana
- lembrete automatico 24 horas antes

## Decisao arquitetural principal

Nao usar o n8n para reservar agenda automaticamente no inicio.

Usar o n8n para:

- captar
- qualificar
- estruturar
- organizar

E usar o admin para:

- validar
- confirmar
- operar

Essa divisao e a melhor forma de comecar a expandir com seguranca.
