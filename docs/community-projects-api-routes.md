# Rotas de API para Projetos da Comunidade (Vitrine)

Este documento lista as rotas de API necessárias no backend **Profissão Laser** para suportar a Vitrine de Projetos na comunidade.

**Base URL**: `NEXT_PUBLIC_API_URL` (configurado em `.env`)

**Autenticação**: As rotas de escrita (POST, PATCH, DELETE) exigem autenticação. PATCH e DELETE de projetos requerem permissão de admin. POST (criar projeto) e comentários são acessíveis a membros da comunidade com plano ativo.

---

## Resumo

| Método | Rota | Descrição | Estado |
|--------|------|-----------|--------|
| GET | /community/projects | Lista projetos (paginação, filtros, ordenação) | Já existe (expandir) |
| GET | /community/projects/{id} | Detalhe de um projeto (com comentários) | A implementar |
| POST | /community/projects | Criar projeto | Já existe |
| PATCH | /community/projects/{id} | Atualizar projeto (admin) | A implementar |
| DELETE | /community/projects/{id} | Remover projeto (admin) | A implementar |
| GET | /community/projects/{id}/comments | Listar comentários do projeto | A implementar |
| POST | /community/projects/{id}/comments | Adicionar comentário | A implementar |

---

## Detalhamento

### 1. GET /community/projects (já existe - expandir)

Lista projetos da vitrine.

**Query params**:
- `page` (opcional): Página para paginação (default: 1)
- `limit` (opcional): Itens por página (default: 12)
- `material` (opcional): Filtrar por material
- `technique` (opcional): Filtrar por técnica
- `search` (opcional): Busca por título ou autor
- `sort` (opcional): `recent` | `likes` (default: recent)

**Resposta**: Array de objetos `Project`

```json
[
  {
    "id": "uuid",
    "title": "Canecas Personalizadas Premium",
    "author": "Maria Silva",
    "img": "https://...",
    "description": "Projeto de personalização em cerâmica",
    "material": "Caneca cerâmica",
    "technique": "UV Laser",
    "time": "2h",
    "likes": 45,
    "comments": 12,
    "createdAt": "2025-01-15T10:30:00Z"
  }
]
```

---

### 2. GET /community/projects/{id} (a implementar)

Retorna o detalhe de um projeto com comentários.

**Path params**:
- `id`: UUID do projeto

**Resposta**: Objeto `ProjectDetail`

```json
{
  "id": "uuid",
  "title": "Canecas Personalizadas Premium",
  "author": "Maria Silva",
  "img": "https://...",
  "description": "Projeto de personalização em cerâmica",
  "material": "Caneca cerâmica",
  "technique": "UV Laser",
  "time": "2h",
  "likes": 45,
  "comments": 12,
  "createdAt": "2025-01-15T10:30:00Z",
  "commentList": [
    {
      "id": "uuid",
      "author": "Admin",
      "content": "Excelente trabalho!",
      "time": "2025-01-16T09:00:00Z",
      "isAdmin": true
    }
  ]
}
```

Alternativa: usar `GET /community/projects/{id}/comments` separadamente para carregar comentários.

---

### 3. POST /community/projects (já existe)

Cria um novo projeto na vitrine.

**Body** (JSON):

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| title | string | Sim | Título do projeto |
| description | string | Sim | Descrição |
| author | string | Sim | Nome do autor |
| img | string | Não | URL da imagem |
| material | string | Não | Material utilizado |
| technique | string | Não | Técnica utilizada |

**Exemplo**:
```json
{
  "title": "Canecas Personalizadas Premium",
  "description": "Projeto de personalização em cerâmica com laser UV",
  "author": "Maria Silva",
  "img": "https://...",
  "material": "Caneca cerâmica",
  "technique": "UV Laser"
}
```

**Resposta**: Objeto `Project` criado (com `id` gerado)

---

### 4. PATCH /community/projects/{id} (a implementar)

Atualiza um projeto existente. Requer permissão de admin.

**Path params**:
- `id`: UUID do projeto

**Body** (JSON): Todos os campos opcionais; enviar apenas os que mudam

| Campo | Tipo | Descrição |
|-------|------|-----------|
| title | string | Título |
| description | string | Descrição |
| img | string | URL da imagem |
| material | string | Material |
| technique | string | Técnica |

**Resposta**: Objeto `Project` atualizado

---

### 5. DELETE /community/projects/{id} (a implementar)

Remove um projeto. Requer permissão de admin.

**Path params**:
- `id`: UUID do projeto

**Resposta**: 204 No Content (ou 200 com body vazio)

---

### 6. GET /community/projects/{id}/comments (a implementar)

Lista comentários de um projeto.

**Path params**:
- `id`: UUID do projeto

**Query params**:
- `page` (opcional): Página
- `limit` (opcional): Itens por página (default: 20)

**Resposta**: Array de objetos `ProjectComment`

```json
[
  {
    "id": "uuid",
    "projectId": "uuid",
    "author": "Admin",
    "content": "Excelente trabalho!",
    "time": "2025-01-16T09:00:00Z",
    "isAdmin": true
  }
]
```

---

### 7. POST /community/projects/{id}/comments (a implementar)

Adiciona um comentário a um projeto. Membros da comunidade e admin podem comentar.

**Path params**:
- `id`: UUID do projeto

**Body** (JSON):

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| content | string | Sim | Conteúdo do comentário |

**Exemplo**:
```json
{
  "content": "Excelente trabalho! Parabéns pela técnica."
}
```

**Resposta**: Objeto `ProjectComment` criado (com `id` gerado)

---

## Tipos TypeScript (referência)

```typescript
interface Project {
  id: string;
  title: string;
  author: string;
  img?: string | null;
  description?: string | null;
  material?: string | null;
  technique?: string | null;
  time?: string | null;
  likes?: number;
  comments?: number;
  createdAt?: string;  // ISO 8601
}

interface ProjectComment {
  id: string;
  projectId: string;
  author: string;
  content: string;
  time: string;        // ISO 8601 ou formato legível
  isAdmin?: boolean;
}
```

---

## Mapeamento Frontend → API

| Componente / Funcionalidade | Serviço (src/services/community.ts) | Rota API |
|----------------------------|-------------------------------------|----------|
| Vitrine - listar projetos | getProjects() | GET /community/projects |
| Vitrine - detalhe projeto | getProject(id) | GET /community/projects/{id} |
| Vitrine - enviar projeto | createProject() | POST /community/projects |
| Vitrine - curtir projeto | (futuro) likeProject(id) | POST /community/projects/{id}/like |
| Vitrine - comentários | getProjectComments(id) | GET /community/projects/{id}/comments |
| Vitrine - adicionar comentário | createProjectComment(id, body) | POST /community/projects/{id}/comments |
| Admin - editar projeto | updateProject(id, data) | PATCH /community/projects/{id} |
| Admin - remover projeto | deleteProject(id) | DELETE /community/projects/{id} |
| Admin - comentar projeto | createProjectComment(id, body) | POST /community/projects/{id}/comments |

---

## Notas

1. **Autorização**: PATCH e DELETE de projetos requerem permissão de admin. POST de projeto e comentários requerem membro com plano ativo (comunidade).
2. **Upload de imagens**: Para o campo `img`, considerar endpoint de upload (ex: `POST /community/upload`) que retorna URL, ou usar multipart no POST do projeto.
3. **Ordenação**: O GET com `sort=recent` deve ordenar por `createdAt` descendente. `sort=likes` por `likes` descendente.
4. **Paginação**: Respostas de listagem podem incluir metadados como `total`, `page`, `limit` para suportar paginação no frontend.
