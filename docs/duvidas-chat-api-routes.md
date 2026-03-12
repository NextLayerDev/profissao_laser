# Rotas de API Necessárias para Dúvidas - Chats com Técnicos

Este documento lista as rotas de API que precisam ser implementadas no backend Profissão Laser para que o sistema de dúvidas (chats diretos com técnicos) funcione integralmente.

**Base URL**: `NEXT_PUBLIC_API_URL` (configurado em `.env`)

**Autenticação**:
- Rotas de **cliente**: token Bearer do `customer`
- Rotas de **admin/técnico**: token Bearer do `user`

---

## Resumo por Recurso

| Recurso | Rotas | Descrição |
|---------|-------|-----------|
| Categorias | GET, POST, PATCH, DELETE, reorder | CRUD de categorias de dúvidas |
| Técnicos | GET, GET/:id | Listar técnicos e detalhe |
| Perguntas padrão | GET, POST, PATCH, DELETE, reorder | Perguntas de qualificação por técnico |
| Chats (cliente) | GET, POST, GET/:id, POST/:id/messages | Listar, criar, ver chat, enviar mensagem |
| Chats (admin) | GET /admin | Listar dúvidas por categoria |
| Atribuição | POST /:id/assign-random | Atribuir técnico aleatório |

---

## 1. Categorias (Admin)

### Listar categorias

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /doubt-categories | Lista todas as categorias ordenadas |

**Resposta**: Array de `DoubtCategory`

```json
[
  {
    "id": "uuid",
    "title": "Configuração de equipamento",
    "description": "Dúvidas sobre EZCAD e máquinas",
    "order": 0
  }
]
```

### Criar categoria

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /doubt-categories | Criar nova categoria |

**Body**:
```json
{
  "title": "Configuração de equipamento",
  "description": "Dúvidas sobre EZCAD e máquinas",
  "order": 0
}
```

### Atualizar categoria

| Método | Rota | Descrição |
|--------|------|-----------|
| PATCH | /doubt-categories/:id | Atualizar categoria |

**Body** (parcial):
```json
{
  "title": "Novo título",
  "description": "Nova descrição",
  "order": 1
}
```

### Eliminar categoria

| Método | Rota | Descrição |
|--------|------|-----------|
| DELETE | /doubt-categories/:id | Eliminar categoria |

### Reordenar categorias

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /doubt-categories/reorder | Reordenar categorias |

**Body**:
```json
{
  "categoryIds": ["id1", "id2", "id3"]
}
```

---

## 2. Técnicos

### Listar técnicos

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /technicians | Lista técnicos disponíveis |

**Resposta**: Array de `Technician` (sem `defaultQuestions` por padrão, ou com `?include=defaultQuestions`)

### Obter técnico por ID

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /technicians/:id | Detalhe do técnico (incl. perguntas padrão) |

---

## 3. Perguntas Padrão (Técnico)

### Listar perguntas do técnico

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /technicians/:id/default-questions | Lista perguntas de qualificação |

### Criar pergunta

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /technicians/:id/default-questions | Adicionar pergunta |

**Body**:
```json
{
  "text": "Qual o modelo da sua máquina?",
  "type": "text",
  "options": null,
  "order": 0
}
```

Tipos: `text`, `textarea`, `select`. Para `select`, `options` é array de strings.

### Atualizar pergunta

| Método | Rota | Descrição |
|--------|------|-----------|
| PATCH | /doubt-default-questions/:id | Atualizar pergunta |

### Eliminar pergunta

| Método | Rota | Descrição |
|--------|------|-----------|
| DELETE | /doubt-default-questions/:id | Eliminar pergunta |

### Reordenar perguntas

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /technicians/:id/default-questions/reorder | Reordenar perguntas |

**Body**:
```json
{
  "questionIds": ["id1", "id2", "id3"]
}
```

---

## 4. Dúvidas / Chats (Cliente)

### Listar chats do cliente

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /doubt-chats | Lista chats do customer logado |

**Query**:
- `status`: `pending` | `answered` | `all` (opcional, default: `all`)

**Resposta**: Array de `DoubtChat` (resumo, sem todas as mensagens)

### Criar chat (nova dúvida)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /doubt-chats | Criar nova dúvida/chat |

**Body**:
```json
{
  "categoryId": "uuid",
  "technicianId": "uuid",
  "qualificationAnswers": {
    "questionId1": "resposta1",
    "questionId2": "resposta2"
  },
  "initialMessage": "Texto da primeira mensagem"
}
```

- `technicianId`: opcional. Se omitido, usar atribuição aleatória.
- `qualificationAnswers`: opcional, conforme perguntas do técnico.

### Obter chat por ID

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /doubt-chats/:id | Detalhe do chat com todas as mensagens |

### Enviar mensagem

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /doubt-chats/:id/messages | Enviar mensagem no chat |

**Body**:
```json
{
  "content": "Texto da mensagem"
}
```

---

## 5. Dúvidas (Admin / Técnico)

### Listar chats (admin)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /doubt-chats/admin | Lista todos os chats, agrupados por categoria |

**Query**:
- `categoryId`: filtrar por categoria (opcional)

### Responder (técnico)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /doubt-chats/:id/messages | Enviar resposta (requer token user) |

**Body**: igual ao cliente. O backend identifica pelo token se é técnico e marca `isTechnician: true`.

---

## 6. Atribuição

### Atribuir técnico aleatório

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /doubt-chats/:id/assign-random | Atribuir técnico disponível aleatoriamente |

Usado quando o cliente escolhe "Atribuir aleatoriamente" ou quando o chat foi criado sem `technicianId`.

---

## Estruturas de Dados

### DoubtCategory
```ts
{
  id: string;
  title: string;
  description?: string;
  order: number;
}
```

### Technician
```ts
{
  id: string;
  name: string;
  email?: string;
  defaultQuestions?: DefaultQuestion[];
}
```

### DefaultQuestion
```ts
{
  id: string;
  text: string;
  type: 'text' | 'select' | 'textarea';
  options?: string[];
  order: number;
}
```

### DoubtChat
```ts
{
  id: string;
  categoryId: string;
  categoryName: string;
  technicianId?: string;
  technicianName?: string;
  customerId: string;
  customerName?: string;
  status: 'pending' | 'answered';
  messages: ChatMessage[];
  qualificationAnswers?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}
```

### ChatMessage
```ts
{
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  isTechnician: boolean;
  createdAt: string;
}
```

---

## Mapeamento Frontend → API

| Componente / Ação | Rota API |
|-------------------|----------|
| Listar categorias (admin) | GET /doubt-categories |
| Criar/editar/eliminar categoria | POST, PATCH, DELETE /doubt-categories |
| Reordenar categorias | POST /doubt-categories/reorder |
| Listar técnicos (cliente) | GET /technicians |
| Listar perguntas do técnico | GET /technicians/:id/default-questions |
| CRUD perguntas padrão | POST, PATCH, DELETE (rotas acima) |
| Listar chats do cliente | GET /doubt-chats?status=... |
| Criar nova dúvida | POST /doubt-chats |
| Ver chat + mensagens | GET /doubt-chats/:id |
| Enviar mensagem (cliente) | POST /doubt-chats/:id/messages |
| Listar chats (admin) | GET /doubt-chats/admin |
| Responder (técnico) | POST /doubt-chats/:id/messages |
| Atribuir aleatório | POST /doubt-chats/:id/assign-random |
