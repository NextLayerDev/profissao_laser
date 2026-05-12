# API Adjustments 2.0 - Endpoints necessarios

Documento com os endpoints e campos que precisam ser criados/ajustados na API para tornar os dados mock em dados reais.

---

## 1. Suporte Online (`/course/duvidas`)

### Novos endpoints

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/doubt-chats/stats` | Retorna contagens de chamados por status (`pending`, `answered`, `total`) |
| `GET` | `/knowledge-base` | Lista artigos/guias da base de conhecimento com `title`, `type` (artigo/video), `readTime`, `icon`, `category` |
| `GET` | `/knowledge-base/:id` | Detalhe de um artigo |

### Campos novos no response existente

| Recurso | Campo | Tipo | Descricao |
|---------|-------|------|-----------|
| `DoubtChat` | `ticketNumber` | `string` | Numero sequencial do chamado (ex: `#001`). Atualmente derivado do index no frontend |
| `DoubtChat` | `category.title` | `string` | Ja existe mas precisa ser incluido no GET /doubt-chats (populate) |

---

## 2. Biblioteca de Vetores (`/course/biblioteca-vetores`)

### Novos endpoints

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/community/vector-library/stats` | Totais: vetores disponiveis, colecoes, favoritos do user, downloads totais |
| `GET` | `/community/vector-library/categories` | Lista de categorias com `name`, `icon`, `count` |
| `POST` | `/community/vector-library/files/:id/favorite` | Favoritar/desfavoritar um vetor. Toggle. |
| `DELETE` | `/community/vector-library/files/:id/favorite` | Remover favorito |
| `GET` | `/community/vector-library/favorites` | Listar vetores favoritados pelo usuario |
| `GET` | `/community/vector-library/featured` | Colecoes/vetores em destaque (curadoria) |

### Ajustes no endpoint existente

| Endpoint | Ajuste | Descricao |
|----------|--------|-----------|
| `GET /community/vector-library/contents` | Query params: `search`, `category`, `format`, `sort` | Suporte a filtros e busca server-side |
| `GET /community/vector-library/contents` | Paginacao: `page`, `limit` | Retornar `total` no response para paginacao |

### Campos novos no response existente

| Recurso | Campo | Tipo | Descricao |
|---------|-------|------|-----------|
| `VectorLibraryFile` | `formats` | `string[]` | Lista de formatos disponiveis (ex: `["SVG", "DXF", "CDR"]`). Atualmente derivado da extensao no frontend |
| `VectorLibraryFile` | `downloadCount` | `number` | Contagem de downloads |
| `VectorLibraryFile` | `isFavorited` | `boolean` | Se o usuario atual favoritou |
| `VectorLibraryFile` | `category` | `string` | Categoria do vetor |

---

## 3. Vetorizacao (`/course/vetorizacao`)

### Novos endpoints

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `POST` | `/api/vectorize/batch` | Vetorizacao em lote. Aceita array de files |
| `GET` | `/api/vectorize/export/:format` | Exportar em formatos alternativos (DXF, PNG) |

### Ajustes no endpoint existente

| Endpoint | Ajuste | Descricao |
|----------|--------|-----------|
| `POST /api/vectorize` | Novos params no body | `mode` (contorno/detalhado/preenchimento), `detailLevel` (0-100), `smoothing` (0-100), `noiseReduction` (0-100), `blackAndWhite` (boolean), `invertColors` (boolean) |
| `GET /customer/vectors` | Campo adicional | `params` (objeto com parametros usados na vetorizacao) |

### Campos novos no response existente

| Recurso | Campo | Tipo | Descricao |
|---------|-------|------|-----------|
| `VectorizeResult` | `dxfContent` | `string?` | Conteudo DXF (quando suportado) |
| `VectorizeResult` | `pngUrl` | `string?` | URL do PNG renderizado |
| `CustomerVector` | `params` | `object?` | Parametros usados na vetorizacao (mode, detailLevel, etc.) |

---

## 4. Parametros (`/course/parametros`)

### Novos endpoints (CRUD completo)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/parameters` | Listar parametros com filtros: `machine`, `model`, `material`, `thickness`, `page`, `limit`, `search` |
| `GET` | `/parameters/:id` | Detalhe de um parametro |
| `POST` | `/parameters` | Criar novo parametro |
| `PUT` | `/parameters/:id` | Atualizar parametro |
| `DELETE` | `/parameters/:id` | Remover parametro |
| `GET` | `/parameters/stats` | Estatisticas: total tabelas, maquinas, materiais, contribuidores |
| `GET` | `/parameters/machines` | Catalogo de maquinas laser (marca, modelo) |
| `GET` | `/parameters/materials` | Catalogo de materiais (nome, tipo, espessuras comuns) |
| `GET` | `/parameters/community` | Parametros compartilhados pela comunidade com rating e likes |
| `POST` | `/parameters/:id/save` | Salvar/bookmark um parametro da comunidade |
| `DELETE` | `/parameters/:id/save` | Remover bookmark |
| `POST` | `/parameters/:id/rate` | Avaliar parametro da comunidade (1-5 estrelas) |
| `POST` | `/parameters/:id/like` | Curtir parametro |
| `GET` | `/parameters/export` | Exportar tabela (CSV/PDF) com filtros aplicados |

### Schema sugerido

```typescript
interface LaserParameter {
  id: string;
  material: string;
  materialType: string; // ex: "Madeira", "Plastico", "Metal"
  thickness: string; // ex: "3mm"
  power: number; // 0-100 (%)
  speed: number; // mm/s
  frequency: number; // Hz
  passes: number;
  mode: string; // "Corte" | "Gravacao" | "Marcacao"
  gas: string; // "Ar" | "N2" | "O2" | "-"
  machine?: string; // marca/modelo
  createdBy: string; // userId
  isPublic: boolean;
  rating?: number; // media 1-5
  likesCount?: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## Resumo de prioridades

### Alta (bloqueiam funcionalidades core)
1. `POST /api/vectorize` com parametros - permite ajustes reais na vetorizacao
2. CRUD `/parameters` - toda a pagina de parametros depende disto
3. `GET /parameters/community` - ranking e compartilhamento

### Media (melhoram UX significativamente)
4. `GET /community/vector-library/stats` - dashboard da biblioteca
5. `POST /community/vector-library/files/:id/favorite` - sistema de favoritos
6. `GET /doubt-chats/stats` - contagens no suporte
7. Campo `ticketNumber` em DoubtChat

### Baixa (nice to have)
8. `GET /knowledge-base` - artigos de ajuda
9. `POST /api/vectorize/batch` - vetorizacao em lote
10. Export DXF/PNG na vetorizacao
11. `GET /parameters/export` - exportacao de tabela
