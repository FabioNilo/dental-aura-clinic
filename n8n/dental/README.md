# Pasta `dental` no n8n

Estrutura oficial proposta para os workflows da clinica.

## Estrutura

- `00-infra`
- `clientes`
- `atendimentos`
- `clinico`
- `faturamento`
- `admin`
- `integracoes`
- `arquivados`

## Convencao de nomes

- `AREA - acao - v1`
- Exemplos:
  - `ADMIN - login`
  - `ATD - captura whatsapp`
  - `CLIN - prontuario criar`
  - `FIN - fatura registrar`

## Regras

- Cada dominio deve ter seus workflows agrupados na pasta correspondente.
- Workflows antigos ou substituidos devem ir para `arquivados`.
- Os contratos de entrada e saida precisam ficar documentados em `docs/`.
