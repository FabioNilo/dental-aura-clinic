# Workflows n8n publicados

Instancia: `https://yt-n8n.ftr0hc.easypanel.host`

Todos os workflows abaixo usam o PostgreSQL dedicado do Dental Aura via credencial n8n.
Na criacao pelo MCP, o n8n vinculou automaticamente a credencial `FabioDb`.
Confirme no painel se essa credencial aponta para o banco onde foram executados:

- `n8n/dental/00-infra/dental-aura-postgres-schema.sql`
- `n8n/dental/00-infra/dental-aura-bootstrap-admin.sql`

## Autenticacao

| Workflow | ID | URL |
| --- | --- | --- |
| Dental Aura - Platform Auth Login | `epK5Ez091Rqell1Y` | `https://yt-n8n.ftr0hc.easypanel.host/workflow/epK5Ez091Rqell1Y` |
| Dental Aura - Clinic Auth Login | `McGO1yAH2z1MgIOU` | `https://yt-n8n.ftr0hc.easypanel.host/workflow/McGO1yAH2z1MgIOU` |
| Dental Aura - Auth Logout API | `RPusq4voPeJpuAws` | `https://yt-n8n.ftr0hc.easypanel.host/workflow/RPusq4voPeJpuAws` |

Endpoints publicados:

- `POST /webhook/dental-aura/platform/auth/login`
- `POST /webhook/dental-aura/platform/auth/logout`
- `POST /webhook/dental-aura/clinic/auth/login`
- `POST /webhook/dental-aura/clinic/auth/logout`

## Plataforma

| Workflow | ID | URL |
| --- | --- | --- |
| Dental Aura - Platform API | `FrbymfaMpAJaXX7d` | `https://yt-n8n.ftr0hc.easypanel.host/workflow/FrbymfaMpAJaXX7d` |

Endpoints publicados:

- `GET /webhook/dental-aura/platform/clinics`
- `POST /webhook/dental-aura/platform/clinics`
- `PATCH /webhook/dental-aura/platform/clinics/:id`
- `DELETE /webhook/dental-aura/platform/clinics/:id`
- `POST /webhook/dental-aura/platform/users`

## Clinica

| Workflow | ID | URL |
| --- | --- | --- |
| Dental Aura - Clinic Overview API | `cerQvmTIYUjU0QBG` | `https://yt-n8n.ftr0hc.easypanel.host/workflow/cerQvmTIYUjU0QBG` |
| Dental Aura - Clinic Patients API | `b42tAFMyivRdtorU` | `https://yt-n8n.ftr0hc.easypanel.host/workflow/b42tAFMyivRdtorU` |
| Dental Aura - Clinic Professionals Services API | `u4JCDL8zn5SVKRMp` | `https://yt-n8n.ftr0hc.easypanel.host/workflow/u4JCDL8zn5SVKRMp` |
| Dental Aura - Clinic Appointments Requests API | `SxakGEjItbCmfHxF` | `https://yt-n8n.ftr0hc.easypanel.host/workflow/SxakGEjItbCmfHxF` |
| Dental Aura - Clinic Finance API | `xbfCbgphut82rp6A` | `https://yt-n8n.ftr0hc.easypanel.host/workflow/xbfCbgphut82rp6A` |
| Dental Aura - Clinic Records API | `cO6pOFNcv9jQN320` | `https://yt-n8n.ftr0hc.easypanel.host/workflow/cO6pOFNcv9jQN320` |

Endpoints publicados:

- `GET /webhook/dental-aura/clinic/overview/kpis`
- `GET /webhook/dental-aura/clinic/overview/chart-week`
- `GET /webhook/dental-aura/clinic/overview/activities`
- `GET /webhook/dental-aura/clinic/overview/upcoming-appointments`
- `GET /webhook/dental-aura/clinic/patients`
- `POST /webhook/dental-aura/clinic/patients`
- `GET /webhook/dental-aura/clinic/patients/context`
- `GET /webhook/dental-aura/clinic/patients/:id`
- `PATCH /webhook/dental-aura/clinic/patients/:id`
- `GET /webhook/dental-aura/clinic/professionals`
- `POST /webhook/dental-aura/clinic/professionals`
- `GET /webhook/dental-aura/clinic/professionals/options`
- `GET /webhook/dental-aura/clinic/professionals/:id`
- `PATCH /webhook/dental-aura/clinic/professionals/:id`
- `GET /webhook/dental-aura/clinic/services`
- `POST /webhook/dental-aura/clinic/services`
- `GET /webhook/dental-aura/clinic/services/options`
- `GET /webhook/dental-aura/clinic/services/:id`
- `PATCH /webhook/dental-aura/clinic/services/:id`
- `GET /webhook/dental-aura/clinic/appointments`
- `PATCH /webhook/dental-aura/clinic/appointments/:id`
- `GET /webhook/dental-aura/clinic/requests`
- `POST /webhook/dental-aura/clinic/requests`
- `GET /webhook/dental-aura/clinic/requests/by-appointment/:appointmentId`
- `GET /webhook/dental-aura/clinic/requests/:id`
- `POST /webhook/dental-aura/clinic/requests/:id/confirm`
- `POST /webhook/dental-aura/clinic/requests/:id/reschedule`
- `POST /webhook/dental-aura/clinic/requests/:id/cancel`
- `GET /webhook/dental-aura/clinic/finance/services`
- `POST /webhook/dental-aura/clinic/finance/services`
- `PATCH /webhook/dental-aura/clinic/finance/services/:id`
- `GET /webhook/dental-aura/clinic/finance/patients-search`
- `GET /webhook/dental-aura/clinic/finance/budgets`
- `POST /webhook/dental-aura/clinic/finance/budgets`
- `GET /webhook/dental-aura/clinic/finance/budgets/:id`
- `PATCH /webhook/dental-aura/clinic/finance/budgets/:id`
- `POST /webhook/dental-aura/clinic/finance/budgets/:id/convert-to-invoice`
- `GET /webhook/dental-aura/clinic/finance/invoices`
- `POST /webhook/dental-aura/clinic/finance/invoices`
- `GET /webhook/dental-aura/clinic/finance/invoices/:id`
- `PATCH /webhook/dental-aura/clinic/finance/invoices/:id`
- `POST /webhook/dental-aura/clinic/finance/payments`
- `GET /webhook/dental-aura/clinic/finance/coupons`
- `POST /webhook/dental-aura/clinic/finance/coupons`
- `POST /webhook/dental-aura/clinic/finance/coupons/validate`
- `GET /webhook/dental-aura/clinic/finance/summary`
- `GET /webhook/dental-aura/clinic/finance/debtors`
- `GET /webhook/dental-aura/clinic/records/patients/:patientId`
- `POST /webhook/dental-aura/clinic/records`
- `GET /webhook/dental-aura/clinic/records/treatments`
- `POST /webhook/dental-aura/clinic/records/treatments`
- `PATCH /webhook/dental-aura/clinic/records/treatments/:id`
- `POST /webhook/dental-aura/clinic/records/treatments/:id/sessions`
- `POST /webhook/dental-aura/clinic/records/treatments/:id/cancel`
- `GET /webhook/dental-aura/clinic/records/:id`
- `PATCH /webhook/dental-aura/clinic/records/:id`

## Validacao feita

- Login platform com `teste@gmail.com` retornou JSON com `token` e `admin`.
- Login clinica com `admin@clinica-inicial.local` retornou JSON com `token`, `clinic` e `user`.
- `GET /platform/clinics` retornou a clinica inicial usando token de platform.
- `GET /clinic/overview/kpis` retornou KPIs usando token da clinica.
- Leituras autenticadas de pacientes, profissionais, servicos, agenda, solicitacoes, financeiro summary e tratamentos retornaram `200` com JSON.
