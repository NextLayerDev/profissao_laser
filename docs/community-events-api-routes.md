# Rotas de API para Eventos da Comunidade

Este documento lista as rotas de API necessárias no backend **Profissão Laser** para suportar a gestão completa de eventos e lives na comunidade.

**Base URL**: `NEXT_PUBLIC_API_URL` (configurado em `.env`)

**Autenticação**: As rotas de escrita (POST, PATCH, DELETE) devem exigir autenticação de utilizador admin. A rota GET pode ser acessível a clientes com plano que inclui `comunidade`.

---

## Resumo

| Método | Rota | Descrição | Estado |
|--------|------|-----------|--------|
| GET | /community/events | Lista eventos | Implementado |
| POST | /community/events | Criar evento | Implementado |
| PATCH | /community/events/{eventId} | Atualizar evento | Implementado |
| DELETE | /community/events/{eventId} | Remover evento | Implementado |

---

## Detalhamento

### 1. GET /community/events (já existe)

Lista eventos (workshops, lives, Q&A).

**Query params**:
- `from` (opcional): Data início (YYYY-MM-DD) para filtrar
- `to` (opcional): Data fim (YYYY-MM-DD) para filtrar

**Resposta**: Array de objetos `Event`

```json
[
  {
    "id": "uuid",
    "title": "Live Personalização UV",
    "date": "2025-01-15",
    "time": "19:00",
    "type": "live",
    "description": "Aprenda técnicas de personalização com UV"
  }
]
```

---

### 2. POST /community/events

Cria um novo evento.

**Body** (JSON):

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| title | string | Sim | Título do evento |
| description | string | Não | Descrição |
| date | string | Sim | Data no formato YYYY-MM-DD |
| time | string | Não | Hora (ex: "19:00") |
| type | string | Sim | `workshop` \| `live` \| `qa` |

**Exemplo**:
```json
{
  "title": "Workshop Fiber Laser",
  "description": "Introdução à gravação em metal",
  "date": "2025-02-20",
  "time": "20:00",
  "type": "workshop"
}
```

**Resposta**: Objeto `Event` criado (com `id` gerado)

---

### 3. PATCH /community/events/{eventId}

Atualiza um evento existente.

**Path params**:
- `eventId`: UUID do evento

**Body** (JSON): Mesmos campos do POST (todos opcionais; enviar apenas os que mudam)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| title | string | Título |
| description | string | Descrição |
| date | string | Data (YYYY-MM-DD) |
| time | string | Hora |
| type | string | `workshop` \| `live` \| `qa` |

**Resposta**: Objeto `Event` atualizado

---

### 4. DELETE /community/events/{eventId}

Remove um evento.

**Path params**:
- `eventId`: UUID do evento

**Resposta**: 204 No Content (ou 200 com body vazio)

---

## Tipo Event (referência)

```typescript
interface Event {
  id: string;
  title: string;
  date: string;        // YYYY-MM-DD recomendado
  time?: string | null;
  type: 'workshop' | 'live' | 'qa';
  description?: string | null;
}
```

---

## Mapeamento Frontend → API

| Componente | Serviço (src/services/community.ts) | Rota API |
|------------|-------------------------------------|----------|
| Listar eventos (cliente + admin) | getEvents() | GET /community/events |
| Criar evento (admin) | createEvent() | POST /community/events |
| Editar evento (admin) | updateEvent() | PATCH /community/events/{id} |
| Remover evento (admin) | deleteEvent() | DELETE /community/events/{id} |

---

## Notas

1. **Autorização**: Validar que o utilizador tem permissão de admin para POST, PATCH e DELETE.
2. **Validação**: Garantir que `date` está no formato YYYY-MM-DD e que `type` é um dos valores permitidos.
3. **Ordenação**: O GET pode devolver eventos ordenados por data ascendente por defeito.
