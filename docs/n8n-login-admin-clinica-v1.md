# n8n Login Admin Clinica v1

Este contrato foi atualizado para a arquitetura SaaS:

```text
React/Vite -> n8n Webhooks -> PostgreSQL dedicado do Dental Aura
```

O login nao usa Supabase como fonte primaria. O n8n valida email/senha no PostgreSQL da
aplicacao, cria uma sessao em `dental_clinic.sessions` e devolve o tenant resolvido.

## Endpoint

```text
POST /webhook/dental-aura/clinic/auth/login
```

## Request

```json
{
  "app": "dental-aura-clinic",
  "source": "clinic_login",
  "email": "admin@clinica.com",
  "password": "senha-secreta"
}
```

## Response 200

```json
{
  "success": true,
  "data": {
    "token": "session-token",
    "clinic": {
      "id": "uuid-da-clinica",
      "name": "Aura Dental Center",
      "slug": "aura-dental-center"
    },
    "user": {
      "id": "uuid-do-usuario",
      "email": "admin@clinica.com",
      "name": "Admin",
      "role": "clinic_admin",
      "clinic_id": "uuid-da-clinica",
      "clinic_name": "Aura Dental Center",
      "clinic_slug": "aura-dental-center"
    }
  }
}
```

## Regras

- Validar usuario ativo em `dental_clinic.users`.
- Validar clinica ativa em `dental_platform.clinics`.
- Aceitar no painel somente `role = clinic_admin`.
- Gerar token opaco e salvar em `dental_clinic.sessions`.
- Nenhum `clinic_id` recebido do frontend deve ser usado como autoridade.
- Todo endpoint operacional posterior deve resolver `clinic_id` pelo token.

## Variaveis esperadas no front

```text
VITE_DENTAL_AURA_API_BASE_URL=https://SEU-N8N/webhook
```

## Referencia completa

Veja `docs/n8n-postgres-saas-contract.md` e
`n8n/dental/00-infra/dental-aura-postgres-schema.sql`.
