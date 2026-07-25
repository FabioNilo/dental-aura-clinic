# Dental Aura n8n/PostgreSQL SaaS Contract

Arquitetura alvo:

```text
React/Vite -> n8n Webhooks -> PostgreSQL dedicado do Dental Aura
```

O PostgreSQL da aplicacao deve ser separado do banco interno do n8n. O frontend nao recebe
credencial de banco e nao consulta Supabase/PostgreSQL diretamente.

## Variavel do frontend

```text
VITE_DENTAL_AURA_API_BASE_URL=https://SEU-N8N/webhook
```

Use `/webhook` relativo apenas no desenvolvimento local com o proxy do Vite ativo.
Em producao/Lovable, configure uma URL absoluta do n8n, como
`https://yt-n8n.ftr0hc.easypanel.host/webhook`; caso contrario, o deploy estatico pode
responder HTML da propria aplicacao em vez de JSON do n8n.

## Autenticacao

### POST /dental-aura/clinic/auth/login

Request:

```json
{
  "app": "dental-aura-clinic",
  "source": "clinic_login",
  "email": "admin@clinica.com",
  "password": "senha"
}
```

Response 200:

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

### POST /dental-aura/platform/auth/login

Retorna `token` e `admin.role = "platform_admin"`.

## Regra de tenant

- Endpoints `/dental-aura/clinic/*` validam `Authorization: Bearer <token>` em `dental_clinic.sessions`.
- O n8n resolve `clinic_id` pelo token e ignora qualquer `clinic_id` enviado pelo frontend.
- Toda query operacional deve incluir `where clinic_id = $resolvedClinicId`.
- Endpoints `/dental-aura/platform/*` validam token em `dental_platform.platform_sessions`.

## Endpoints principais

```text
GET    /dental-aura/clinic/overview/kpis
GET    /dental-aura/clinic/overview/chart-week
GET    /dental-aura/clinic/overview/activities
GET    /dental-aura/clinic/overview/upcoming-appointments

GET    /dental-aura/clinic/appointments
PATCH  /dental-aura/clinic/appointments/:id

GET    /dental-aura/clinic/requests
POST   /dental-aura/clinic/requests
GET    /dental-aura/clinic/requests/:id
POST   /dental-aura/clinic/requests/:id/confirm
POST   /dental-aura/clinic/requests/:id/reschedule
POST   /dental-aura/clinic/requests/:id/cancel

GET    /dental-aura/clinic/patients
POST   /dental-aura/clinic/patients
GET    /dental-aura/clinic/patients/:id
PATCH  /dental-aura/clinic/patients/:id
GET    /dental-aura/clinic/patients/context

GET    /dental-aura/clinic/professionals
POST   /dental-aura/clinic/professionals
GET    /dental-aura/clinic/professionals/options
GET    /dental-aura/clinic/professionals/:id
PATCH  /dental-aura/clinic/professionals/:id

GET    /dental-aura/clinic/services
POST   /dental-aura/clinic/services
GET    /dental-aura/clinic/services/options
GET    /dental-aura/clinic/services/:id
PATCH  /dental-aura/clinic/services/:id

GET    /dental-aura/clinic/finance/services
POST   /dental-aura/clinic/finance/services
PATCH  /dental-aura/clinic/finance/services/:id
GET    /dental-aura/clinic/finance/patients-search
GET    /dental-aura/clinic/finance/budgets
POST   /dental-aura/clinic/finance/budgets
GET    /dental-aura/clinic/finance/budgets/:id
PATCH  /dental-aura/clinic/finance/budgets/:id
POST   /dental-aura/clinic/finance/budgets/:id/convert-to-invoice
GET    /dental-aura/clinic/finance/invoices
POST   /dental-aura/clinic/finance/invoices
GET    /dental-aura/clinic/finance/invoices/:id
PATCH  /dental-aura/clinic/finance/invoices/:id
POST   /dental-aura/clinic/finance/payments
GET    /dental-aura/clinic/finance/coupons
POST   /dental-aura/clinic/finance/coupons
POST   /dental-aura/clinic/finance/coupons/validate
GET    /dental-aura/clinic/finance/summary
GET    /dental-aura/clinic/finance/debtors

GET    /dental-aura/clinic/records/patients/:patientId
POST   /dental-aura/clinic/records
GET    /dental-aura/clinic/records/:id
PATCH  /dental-aura/clinic/records/:id
GET    /dental-aura/clinic/records/treatments
POST   /dental-aura/clinic/records/treatments
PATCH  /dental-aura/clinic/records/treatments/:id
POST   /dental-aura/clinic/records/treatments/:id/sessions
POST   /dental-aura/clinic/records/treatments/:id/cancel

GET    /dental-aura/platform/clinics
POST   /dental-aura/platform/clinics
PATCH  /dental-aura/platform/clinics/:id
DELETE /dental-aura/platform/clinics/:id
POST   /dental-aura/platform/users
```

## Response envelope

O frontend aceita resposta direta ou envelope, mas o padrao recomendado e:

```json
{
  "success": true,
  "data": {}
}
```

Erros:

```json
{
  "success": false,
  "error": "Mensagem segura para o usuario"
}
```

## Schema SQL

Arquivo base:

```text
n8n/dental/00-infra/dental-aura-postgres-schema.sql
```

Esse schema cria `dental_platform` e `dental_clinic`, com `clinic_id` nas tabelas operacionais.

## Bootstrap de admin

Depois do schema, rode o script abaixo no PostgreSQL dedicado:

```text
n8n/dental/00-infra/dental-aura-bootstrap-admin.sql
```

Ele cria ou atualiza:

- `platform@dental-aura.local` como `platform_admin` em `dental_platform.platform_users`.
- `admin@clinica-inicial.local` como `clinic_admin` vinculado a `clinica-inicial`.

Antes de rodar, troque os emails e senhas no CTE `params`.
