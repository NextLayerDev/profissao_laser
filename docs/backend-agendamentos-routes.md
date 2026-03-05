# Rotas de API para Agendamentos

Este documento resume as rotas de backend para o sistema de agendamentos. O frontend está **integrado** e utiliza os serviços em `src/services/appointments.ts`.

**Base URL**: `NEXT_PUBLIC_API_URL` (configurado em `.env.local`)

**Backend em produção**: `https://profissao-laser-profissao-laser-back.1nwz76.easypanel.host`

**Autenticação**: Todas as rotas requerem token Bearer (`pl_user_token` para admin, `pl_customer_token` para cliente). O interceptor em `src/lib/fetch.ts` adiciona automaticamente o header `Authorization: Bearer <token>`.

---

## Resumo das Rotas

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | /appointments | Listar agendamentos | Bearer |
| GET | /appointments/:id_customer | Listar agendamentos de um cliente (admin only) | Bearer (user) |
| GET | /appointments/technician/:id | Listar agendamentos de um técnico (admin only) | Bearer (user) |
| POST | /appointment | Criar agendamento | Bearer (customer ou user) |
| PATCH | /appointment/:id/status | Atualizar status | Bearer (user/admin) |
| PATCH | /appointment/:id | Atribuir técnico (body: technicianId) | Bearer (user/admin) |
| DELETE | /appointment/:id | Excluir agendamento | Bearer (user/admin) |

---

## Detalhamento

### 1. Listar agendamentos

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /appointments | Lista agendamentos. **Admin**: todos. **Cliente**: apenas os seus (filtrar por `customerId` ou `customerEmail` do token). |

**Resposta**: Array de objetos `Appointment`:

```json
[
  {
    "id": "string",
    "customerName": "string",
    "customerEmail": "string",
    "customerPhone": "string | null",
    "service": "string",
    "date": "YYYY-MM-DD",
    "time": "HH:mm",
    "status": "pendente | confirmado | cancelado | concluido",
    "notes": "string | null",
    "createdAt": "string (ISO 8601)",
    "technicianId": "string (UUID) | null"
  }
]
```

O campo `technicianId` associa o agendamento ao técnico/colaborador responsável. O nome do técnico é resolvido no frontend via `GET /users`.

O backend filtra automaticamente: admin vê todos os agendamentos; cliente vê apenas os seus (via token).

---

### 2. Criar agendamento

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /appointment | Cria um novo agendamento. Aceita token de customer ou user. |

**Body (JSON)**:

```json
{
  "customerName": "string",
  "customerEmail": "string",
  "customerPhone": "string | null (opcional)",
  "service": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:mm",
  "notes": "string | null (opcional)",
  "technicianId": "string (UUID, opcional)"
}
```

**Resposta**: Objeto `Appointment` criado (com `id`, `status: "pendente"`, `createdAt`).

---

### 3. Atualizar status

| Método | Rota | Descrição |
|--------|------|-----------|
| PATCH | /appointment/:id/status | Atualiza o status do agendamento. Apenas user/admin. |

**Body (JSON)**:

```json
{
  "status": "pendente | confirmado | cancelado | concluido"
}
```

**Resposta**: Objeto `Appointment` atualizado.

---

### 4. Excluir agendamento

| Método | Rota | Descrição |
|--------|------|-----------|
| DELETE | /appointment/:id | Exclui o agendamento. Apenas user/admin. |

**Resposta**: 204 No Content ou 200 OK.

---

### 5. Listar agendamentos por técnico

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /appointments/technician/:id | Lista agendamentos do técnico com o ID indicado. **Admin only.** |

**Parâmetros**: `id` (UUID) — ID do técnico (utilizador com role `tecnico` ou `colaborador`).

**Resposta**: Array de objetos `Appointment` do técnico.

---

### 6. Atribuir técnico ao agendamento

| Método | Rota | Descrição |
|--------|------|-----------|
| PATCH | /appointment/:id | Atualiza o técnico do agendamento. Body: `{ "technicianId": "string" }`. **Admin/colaborador.** |

**Nota:** Se o backend usar rota diferente (ex: `/appointment/:id/technician`), ajustar em `src/services/appointments.ts`.

### 7. Criar agendamento com técnico

O body do **POST /appointment** aceita opcionalmente `technicianId` para atribuir o técnico na criação.

---

## Mapeamento Frontend → API

| Componente / Funcionalidade | Serviço (src/services/appointments.ts) | Rota API |
|----------------------------|--------------------------------------|----------|
| Admin - listar agendamentos | getAppointments() | GET /appointments |
| Admin - listar por cliente | getAppointmentsByCustomer() | GET /appointments/:id_customer |
| Admin - listar por técnico | getAppointmentsByTechnician() | GET /appointments/technician/:id |
| Cliente - criar agendamento | createAppointment() | POST /appointment |
| Admin - alterar status | updateAppointmentStatus() | PATCH /appointment/:id/status |
| Admin - atribuir técnico | updateAppointmentTechnician() | PATCH /appointment/:id |
| Admin - excluir | deleteAppointment() | DELETE /appointment/:id |

---

## Notas de Implementação

1. **Autorização**:
   - `GET /appointments`: Admin vê todos; Cliente vê apenas os seus (filtrar por email ou customerId do JWT).
   - `POST /appointment`: Tanto admin quanto cliente podem criar.
   - `PATCH` e `DELETE`: Apenas utilizadores com token `pl_user_token` (admin/colaborador).

2. **Validação**: O frontend envia `date` e `time` no formato indicado. Validar no backend que a data não é no passado e que o horário é válido.

3. **Status inicial**: Novos agendamentos devem ser criados com `status: "pendente"`.

4. **Serviços**: O campo `service` é uma string livre. O frontend usa uma lista fixa (Depilação a laser, Tratamento de manchas, etc.) em `src/utils/constants/appointment-services.ts`, mas aceita qualquer valor.

---

## Configuração para Integração

Para o frontend comunicar com o backend, defina no `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://profissao-laser-profissao-laser-back.1nwz76.easypanel.host
```

O frontend já está integrado: os serviços, hooks e componentes utilizam estas rotas. Basta garantir que o utilizador está autenticado (cliente em `/login` ou admin em `/login/admin`) para que o token seja enviado nas requisições.
