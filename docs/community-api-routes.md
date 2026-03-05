# Rotas de API da Comunidade VIP

Este documento lista todas as rotas de API da Comunidade VIP. **A API já existe no backend** e está integrada no frontend (cliente em `/comunity` e admin em `/products/[id]` → aba Comunidade).

**Base URL**: `NEXT_PUBLIC_API_URL` (configurado em `.env`)

**Autenticação**: Todas as rotas requerem token Bearer (customer logado com plano que inclui `comunidade`).

---

## Resumo por Recurso

| Recurso   | Rotas necessárias                                      | Recurso UI                    |
|-----------|--------------------------------------------------------|-------------------------------|
| Posts     | GET, POST /community/posts                             | Feed Principal                |
| Canais    | GET, POST /community/channels                          | Sidebar de canais             |
| Mensagens | GET, POST /community/channels/{id}/messages            | Chat por canal                |
| Membros   | GET /community/members                                 | Aba Membros                   |
| Projetos  | GET, POST /community/projects                          | Vitrine de Projetos           |
| Eventos   | GET /community/events                                  | Agenda / Calendário           |
| Ranking   | GET /community/ranking                                | Ranking & Conquistas          |

---

## Detalhamento das Rotas

### 1. Posts (Feed)

| Método | Rota                | Descrição                    | Body / Params |
|--------|---------------------|------------------------------|---------------|
| GET    | /community/posts    | Lista posts do feed          | Query: `?page=1&limit=20` |
| POST   | /community/posts    | Criar novo post              | `{ content: string, image?: string }` |

**Resposta GET**: Array de objetos com `id`, `author`, `avatar`, `time`, `content`, `image?`, `likes`, `comments`, `shares`, `liked`.

**Resposta POST**: Objeto do post criado.

---

### 2. Canais

| Método | Rota                 | Descrição                    | Body / Params |
|--------|----------------------|------------------------------|---------------|
| GET    | /community/channels  | Lista canais disponíveis     | — |
| POST   | /community/channels   | Criar novo canal             | `{ name: string }` |

**Resposta GET**: Array de objetos com `id`, `label`, `description?`, `category`.

**Resposta POST**: `{ id: string }`.

---

### 3. Mensagens de Canal (Chat)

| Método | Rota                                      | Descrição                    | Body / Params |
|--------|-------------------------------------------|------------------------------|---------------|
| GET    | /community/channels/{channelId}/messages | Lista mensagens do canal     | Query: `?before=id&limit=50` |
| POST   | /community/channels/{channelId}/messages | Enviar mensagem (com ficheiro)| `multipart/form-data`: `content` (text), `file` (opcional) |

**Resposta GET**: Array de objetos com `id`, `user`, `avatar`, `content`, `time`, `isMe`, `fileUrl?`.

**Resposta POST**: Objeto da mensagem criada.

---

### 4. Membros

| Método | Rota                 | Descrição                    | Body / Params |
|--------|----------------------|------------------------------|---------------|
| GET    | /community/members   | Lista membros da comunidade  | Query: `?search=termo&category=fiber` |

**Resposta**: Array de objetos com `name`, `specialty`, `badges`, `category`, `image?`.

---

### 5. Projetos (Vitrine)

| Método | Rota                  | Descrição                    | Body / Params |
|--------|-----------------------|------------------------------|---------------|
| GET    | /community/projects   | Lista projetos da vitrine    | Query: `?page=1&limit=12` |
| POST   | /community/projects   | Enviar novo projeto          | `{ title, description, author, img, material?, technique? }` |

**Resposta GET**: Array de objetos com `title`, `author`, `img`, `description`, `material`, `technique`, `time`, `likes`, `comments`.

**Resposta POST**: Objeto do projeto criado.

---

### 6. Eventos

| Método | Rota                 | Descrição                    | Body / Params |
|--------|----------------------|------------------------------|---------------|
| GET    | /community/events    | Lista eventos (workshops, lives, Q&A) | Query: `?from=date&to=date` |

**Resposta**: Array de objetos com `id`, `title`, `date`, `time`, `type` (workshop | live | qa), `description`.

---

### 7. Ranking

| Método | Rota                 | Descrição                    | Body / Params |
|--------|----------------------|------------------------------|---------------|
| GET    | /community/ranking   | Ranking da comunidade        | Query: `?period=week` (opcional) |

**Resposta**: Objeto com `top` (array dos 3 primeiros) e `rest` (array dos demais), cada item com `pos`, `name`, `pts`.

---

## Mapeamento Frontend → API

| Componente / Funcionalidade | Serviço (src/services/community.ts) | Rota API |
|----------------------------|-------------------------------------|----------|
| Feed - listar posts       | getPosts()                          | GET /community/posts |
| Feed - publicar post      | createPost()                        | POST /community/posts |
| Sidebar - listar canais   | getChannels()                       | GET /community/channels |
| Criar canal               | createChannel()                     | POST /community/channels |
| Chat - mensagens          | getChannelMessages()                | GET /community/channels/{id}/messages |
| Chat - enviar mensagem    | sendChannelMessage()                | POST /community/channels/{id}/messages |
| Membros - listar          | getMembers()                       | GET /community/members |
| Vitrine - listar          | getProjects()                      | GET /community/projects |
| Vitrine - enviar          | createProject()                    | POST /community/projects |
| Calendário - eventos      | getEvents()                        | GET /community/events |
| Ranking                   | getRanking()                       | GET /community/ranking |

---

## Notas de Implementação

1. **Autorização**: Validar que o customer tem plano ativo com classe que possui `comunidade: true` antes de permitir acesso a qualquer rota.

2. **Paginação**: As rotas de listagem (posts, projetos, mensagens) devem suportar paginação para escalar.

3. **Upload de imagens**: Para posts e projetos com imagem, considerar endpoint separado de upload (ex: `POST /community/upload`) ou usar `POST /product/{id}/image` como referência de padrão do projeto.

4. **WebSockets (opcional)**: Para chat em tempo real, considerar WebSocket ou Server-Sent Events para novas mensagens.
