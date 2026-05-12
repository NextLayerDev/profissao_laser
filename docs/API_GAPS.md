# API Gaps — Endpoints REALMENTE missing

> Auditoria feita contra o OpenAPI spec completo da API (207 endpoints).
> Apenas o que NAO EXISTE na API esta documentado aqui.

---

## Legenda

| Simbolo | Significado |
|---------|-------------|
| MISSING | Endpoint NAO existe no OpenAPI spec — precisa ser criado |
| COMING SOON | Feature "Em breve" no front — precisa de definicao + endpoint |

---

## 1. Forum (1 endpoint)

O forum ja tem 14 endpoints na API. O unico que faltava:

| Status | Metodo | Rota | Body | Descricao |
|--------|--------|------|------|-----------|
| DONE | PATCH | `/forum/post/{id}/reply/{replyId}` | `{ content }` | Editar resposta do forum |

---

## 2. Reset Password (1 endpoint)

`POST /forgot-password` ja existe. Passo 2 implementado:

| Status | Metodo | Rota | Body | Descricao |
|--------|--------|------|------|-----------|
| DONE | POST | `/reset-password` | `{ token, newPassword }` | Resetar senha com token |

---

## 3. Gamification (5 endpoints)

Todos os componentes de gamificacao usam dados hardcoded. Nenhum endpoint existe no backend.

| Status | Metodo | Rota | Descricao |
|--------|--------|------|-----------|
| MISSING | GET | `/me/gamification/summary` | Resumo: level, XP atual, XP proximo nivel, streak, badges recentes |
| MISSING | GET | `/me/gamification/badges` | Todas as badges do usuario (conquistadas e disponiveis) |
| MISSING | GET | `/me/gamification/streak` | Streak atual + mapa semanal (quais dias estudou) |
| MISSING | GET | `/challenges/active` | Desafio semanal ativo com detalhes e participantes |
| MISSING | POST | `/challenges/{id}/join` | Participar do desafio ativo |

**Response schemas:**

`GET /me/gamification/summary`:
```json
{
  "level": 12,
  "currentXp": 2450,
  "nextLevelXp": 3000,
  "dailyXp": 45,
  "dailyXpGoal": 100,
  "streak": { "current": 7, "best": 15 },
  "recentBadges": [
    { "id": "uuid", "name": "Primeira Aula", "icon": "play", "earnedAt": "2026-04-20T10:00:00Z" }
  ]
}
```

`GET /me/gamification/streak`:
```json
{
  "currentStreak": 7,
  "bestStreak": 15,
  "weekMap": [
    { "day": "seg", "date": "2026-04-27", "completed": true },
    { "day": "ter", "date": "2026-04-28", "completed": true },
    { "day": "qua", "date": "2026-04-29", "completed": true },
    { "day": "qui", "date": "2026-04-30", "completed": false },
    { "day": "sex", "date": "2026-05-01", "completed": true },
    { "day": "sab", "date": "2026-05-02", "completed": false },
    { "day": "dom", "date": "2026-05-03", "completed": false }
  ]
}
```

`GET /challenges/active`:
```json
{
  "id": "uuid",
  "title": "Desafio da Semana: 5 Aulas",
  "description": "Complete 5 aulas esta semana",
  "type": "weekly",
  "goal": 5,
  "currentProgress": 3,
  "participants": 42,
  "endsAt": "2026-05-04T23:59:59Z",
  "reward": { "xp": 500, "badge": "Dedicado" },
  "joined": true
}
```

---

## 4. Community Opportunities (4 endpoints)

Marketplace de oportunidades de negocio entre membros.

| Status | Metodo | Rota | Body / Params | Descricao |
|--------|--------|------|----------------|-----------|
| MISSING | GET | `/community/opportunities` | `?type=order\|partnership\|supplier&page=&limit=` | Listar oportunidades |
| MISSING | POST | `/community/opportunities` | `{ title, description, type, location?, budget?, contactInfo }` | Criar oportunidade |
| MISSING | PATCH | `/community/opportunities/{id}` | `{ title?, description?, type?, status? }` | Editar oportunidade |
| MISSING | DELETE | `/community/opportunities/{id}` | — | Deletar oportunidade |

**Response schema** (`GET`):
```json
[
  {
    "id": "uuid",
    "title": "Gravacao em 50 copos stanley",
    "description": "Cliente precisa de gravacao personalizada...",
    "type": "order",
    "location": "Sao Paulo, SP",
    "budget": "R$ 1.500",
    "author": { "id": "uuid", "name": "Joao Silva", "avatar": "url" },
    "createdAt": "2026-05-01T14:00:00Z",
    "status": "active"
  }
]
```

---

## 5. Activity Feed (1 endpoint)

Feed de atividades recentes da comunidade.

| Status | Metodo | Rota | Params | Descricao |
|--------|--------|------|--------|-----------|
| DONE | GET | `/community/activity` | `?page=&limit=` | Feed de atividades recentes |

**Response schema:**
```json
[
  {
    "id": "uuid",
    "type": "lesson_completed",
    "user": { "id": "uuid", "name": "Maria Santos", "avatar": "url" },
    "data": { "lessonTitle": "Configurando EZCAD", "courseName": "Curso Fiber Laser" },
    "createdAt": "2026-05-02T10:30:00Z"
  }
]
```

Tipos suportados: `lesson_completed`, `badge_earned`, `forum_post`, `forum_reply`, `challenge_completed`, `opportunity_created`, `member_joined`

---

## 6. Platform Stats (1 endpoint)

Estatisticas agregadas para o rodape da home.

| Status | Metodo | Rota | Descricao |
|--------|--------|------|-----------|
| DONE | GET | `/community/stats` | Estatisticas agregadas da plataforma |

**Response schema:**
```json
{
  "activeMembers": 1250,
  "completedProjects": 3400,
  "messagesSent": 15000,
  "livesRealized": 48
}
```

---

## 7. Community Members — Campos adicionais

O endpoint `GET /community/members` **JA EXISTE**. Campos/filtros implementados:

| Status | Campo / Filtro | Descricao |
|--------|----------------|-----------|
| DONE | `isOnline: boolean` | Indicar se o membro esta online (ou `lastSeenAt` para calcular no front) |
| DONE | `badge: string` | Badge/titulo do membro (ex: "Top Contributor", "Mentor") |
| DONE | `featuredRole: string` | Role destacada para membros em evidencia |
| DONE | `?featured=true` | Filtro para retornar apenas membros destacados |
| DONE | `?online=true` | Filtro para retornar apenas membros online |

> **Nota**: Status online pode usar `lastSeenAt` no response — front calcula "online" se visto nos ultimos 5 min.

---

## 8. Features "Em Breve" (Coming Soon)

Botoes no QuickAccessGrid sem `href` nem `featureKey`. Precisam de definicao de escopo + endpoints:

### 8.1 Previas (~2 endpoints)
- Pre-visualizacao de gravacao laser antes de executar
- `POST /previas/generate` — upload de imagem + preview
- `GET /previas/history` — historico

### 8.2 Parametros — DONE (~15 endpoints)
- Banco de parametros de maquina laser (potencia, velocidade, frequencia por material)
- `GET /parameters` — listar (com filtros: page, limit, machine, model, material, thickness, search, mode)
- `GET /parameters/{id}` — detalhe
- `POST /parameters` — criar
- `PUT /parameters/{id}` — editar
- `DELETE /parameters/{id}` — deletar
- `GET /parameters/community` — listar parametros publicos (sort: recent, rating, likes)
- `GET /parameters/stats` — totalParameters, totalMachines, totalMaterials, totalContributors
- `GET /parameters/machines` — listar maquinas
- `GET /parameters/materials` — listar materiais (com commonThicknesses)
- `POST /parameters/{id}/like` — like/unlike toggle
- `POST /parameters/{id}/rate` — avaliar parametro
- `POST /parameters/{id}/save` — salvar parametro
- `DELETE /parameters/{id}/save` — remover dos salvos
- `GET /parameters/export?format=csv` — exportar CSV

### 8.3 Canva — DONE (~11 endpoints: templates + designs + editor-ai)
- Editor/templates de design para gravacao laser
- `GET /templates` — listar
- `GET /templates/{id}` — detalhe
- `POST /templates/{id}/clone` — clonar template como design
- `GET /designs` — listar designs
- `GET /designs/{id}` — detalhe design
- `POST /designs` — criar design
- `PUT /designs/{id}` — atualizar design
- `POST /designs/{id}/thumbnail` — upload thumbnail
- `DELETE /designs/{id}` — deletar design
- `POST /editor/ai` — gerar/editar imagem com IA
- `POST /editor/remove-background` — remover fundo
- `POST /editor/apply-color` — aplicar cor

### 8.4 Fornecedores Vendas (~5 endpoints)
- Diretorio de fornecedores para venda de produtos laser
- `GET /suppliers` — listar
- `GET /suppliers/{id}` — detalhe
- `POST /suppliers` — criar
- `PATCH /suppliers/{id}` — editar
- `DELETE /suppliers/{id}` — deletar

---

## 9. Knowledge Base CRUD (5 endpoints — NOVOS)

Endpoints novos adicionados para base de conhecimento no suporte:

| Status | Metodo | Rota | Descricao |
|--------|--------|------|-----------|
| DONE | GET | `/knowledge-base` | Listar artigos (params: category, type, search) |
| DONE | POST | `/knowledge-base` | Criar artigo/video |
| DONE | GET | `/knowledge-base/{id}` | Detalhe do artigo |
| DONE | PATCH | `/knowledge-base/{id}` | Atualizar artigo |
| DONE | DELETE | `/knowledge-base/{id}` | Deletar artigo |

---

## 10. Doubt Chat — Stats + ticketNumber (2 novos)

| Status | Metodo | Rota | Descricao |
|--------|--------|------|-----------|
| DONE | GET | `/doubt-chats/stats` | Contadores: pending, answered, total |
| DONE | — | campo `ticketNumber` | Campo ticketNumber adicionado ao DoubtChat response |

---

## 11. Vector Library — Novos endpoints (6 novos)

| Status | Metodo | Rota | Descricao |
|--------|--------|------|-----------|
| DONE | GET | `/community/vector-library/stats` | totalFiles, totalCollections, totalFavorites, totalDownloads |
| DONE | GET | `/community/vector-library/categories` | Categorias com icon e count |
| DONE | GET | `/community/vector-library/favorites` | Arquivos favoritados pelo usuario |
| DONE | GET | `/community/vector-library/featured` | Arquivos em destaque |
| DONE | POST | `/community/vector-library/files/{id}/favorite` | Favoritar arquivo |
| DONE | DELETE | `/community/vector-library/files/{id}/favorite` | Desfavoritar arquivo |

Novos campos no VectorLibraryFile: `formats`, `downloadCount`, `category`, `featured`, `isFavorited`

Novos query params em `/contents`: `search`, `category`, `format`, `sort`, `page`, `limit`

---

## Resumo

| # | Feature | Qtd endpoints | Status |
|---|---------|---------------|--------|
| 1 | Forum (edit reply) | 1 | DONE |
| 2 | Reset Password | 1 | DONE |
| 3 | Gamification | 5 | MISSING |
| 4 | Community Opportunities | 4 | MISSING |
| 5 | Activity Feed | 1 | DONE |
| 6 | Platform Stats | 1 | DONE |
| 7 | Community Members (campos) | — (campos, nao endpoints) | DONE |
| 8.2 | Parametros | ~15 | DONE |
| 9 | Knowledge Base CRUD | 5 | DONE |
| 10 | Doubt Chat stats + ticketNumber | 1 + campo | DONE |
| 11 | Vector Library novos | 6 | DONE |
| 8.3 | Canva | ~11 | DONE |
| **Total MISSING** | | **9 endpoints** | |
| 8.1, 8.4 | Coming Soon (restantes) | ~7 endpoints (a definir) | |

---

## Nota — Endpoints que JA EXISTEM na API (207 total)

Categorias confirmadas no OpenAPI spec (`/docs/openapi.json`):

| Categoria | Exemplos |
|-----------|----------|
| Auth | login, register, forgot-password, me, refresh |
| Appointments | CRUD completo |
| Classes | CRUD + bulk operations |
| System Classes | CRUD completo |
| Community | posts, channels, members, projects, events, ranking |
| Coupons | CRUD |
| Course | GET /course |
| Customers | GET, PATCH |
| Products | GET /products, POST/PATCH/DELETE /product, status, image |
| Purchase | POST /purchase |
| Plans | GET /customer/plans/{email} |
| Subscription | GET /me/subscription, cancel, create, upgrade, downgrade, admin |
| Course Progress | GET progress, POST complete |
| Materials | GET, POST, DELETE |
| Quiz | CRUD quiz + questions |
| Ratings | GET + POST |
| Saved Lessons | GET, POST, DELETE |
| Doubts | GET, POST doubt, POST reply |
| Doubt Chat | Categories, technicians, chats, stats (16 endpoints) |
| FAQ | CRUD + reactions (7 endpoints) |
| Forum | Categories, posts, replies (14 de 15 endpoints) |
| Vectors | CRUD /customer/vectors (5 endpoints) |
| Vector Library | Contents, folders, files, stats, categories, favorites, featured (14 endpoints) |
| Knowledge Base | CRUD artigos/videos (5 endpoints) |
| Parameters | CRUD + community + save/like/rate + export + stats/machines/materials (~15 endpoints) |
| Modules & Lessons | CRUD + reorder + video upload (12 endpoints) |
| Sales & Refunds | Listagens + refund (5 endpoints) |
| Payment Links | CRUD (4 endpoints) |
| Promo Links | CRUD + status (5 endpoints) |
| Global Promo Links | CRUD + status (5 endpoints) |
| Webhook | POST /webhook |
