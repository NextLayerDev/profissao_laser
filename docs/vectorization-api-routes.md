# Rotas de API para Gestão de Vetores (API Profissão Laser)

Este documento especifica **o que deve ser implementado na API Profissão Laser** para a gestão completa das imagens vetorizadas dos clientes.

**Base URL**: `NEXT_PUBLIC_API_URL`

**Autenticação**: Todas as rotas requerem token Bearer (customer logado com plano que inclui `vetorizacao: true` na classe).

---

## Resumo das Rotas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /customer/vectors | Listar vetores do customer |
| GET | /customer/vectors/{id} | Obter um vetor por ID |
| POST | /customer/vectors | Guardar novo vetor |
| PATCH | /customer/vectors/{id} | Editar vetor (nome ou SVG) |
| DELETE | /customer/vectors/{id} | Excluir vetor |

---

## 1. GET /customer/vectors (listar vetores)

Lista os vetores do customer autenticado, ordenados por data de criação (mais recentes primeiro).

**Query params**:
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| page | number | Não | Página (default: 1) |
| limit | number | Não | Itens por página (default: 20, max: 100) |
| search | string | Não | Filtrar por nome (busca parcial) |

**Resposta 200**:
```json
{
  "data": [
    {
      "id": "uuid",
      "original_name": "logo.png",
      "original_url": "https://...",
      "svg_url": "https://...",
      "created_at": "2025-03-03T12:00:00.000Z",
      "updated_at": "2025-03-03T12:00:00.000Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

**Erros**: 401 (não autenticado), 403 (sem acesso à vetorização)

---

## 2. GET /customer/vectors/{id} (obter vetor)

Retorna um vetor específico. O vetor deve pertencer ao customer autenticado.

**Path params**: `id` (UUID)

**Resposta 200**:
```json
{
  "id": "uuid",
  "original_name": "logo.png",
  "original_url": "https://...",
  "svg_url": "https://...",
  "created_at": "2025-03-03T12:00:00.000Z",
  "updated_at": "2025-03-03T12:00:00.000Z"
}
```

**Erros**: 401, 403, 404 (vetor não encontrado ou não pertence ao customer)

---

## 3. POST /customer/vectors (guardar vetor)

Recebe o conteúdo SVG já vetorizado e guarda no banco de vetores do customer.

**Body (JSON)**:
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| svgContent | string | Sim | Conteúdo do SVG (texto) |
| originalName | string | Sim | Nome do ficheiro original (ex: logo.png) |

**Fluxo interno**:
1. Validar autenticação (token customer)
2. Validar plano com `vetorizacao: true`
3. Upload do SVG para Vercel Blob (`logos/{timestamp}_{originalName}.svg`)
4. Inserir em `customer_vectors`
5. Devolver o objeto criado

**Resposta 201**:
```json
{
  "id": "uuid",
  "original_name": "logo.png",
  "original_url": null,
  "svg_url": "https://...",
  "created_at": "2025-03-03T12:00:00.000Z",
  "updated_at": "2025-03-03T12:00:00.000Z"
}
```

**Erros**: 400 (dados inválidos), 401, 403, 502 (erro no upload para Blob)

---

## 4. PATCH /customer/vectors/{id} (editar vetor)

Permite editar o nome ou substituir o conteúdo SVG do vetor. O vetor deve pertencer ao customer autenticado.

**Path params**: `id` (UUID)

**Body (JSON)** – todos os campos são opcionais:
| Campo | Tipo | Descrição |
|-------|------|-----------|
| originalName | string | Novo nome do ficheiro |
| svgContent | string | Novo conteúdo SVG (substitui o atual) |

**Fluxo interno (se svgContent enviado)**:
1. Validar autenticação e ownership
2. Upload do novo SVG para Vercel Blob
3. Atualizar `svg_url` e `updated_at` no registo
4. (Opcional) Remover o ficheiro antigo do Blob para evitar lixo

**Fluxo interno (se apenas originalName)**:
1. Validar autenticação e ownership
2. Atualizar `original_name` e `updated_at`

**Resposta 200**:
```json
{
  "id": "uuid",
  "original_name": "novo-nome.svg",
  "original_url": "https://...",
  "svg_url": "https://...",
  "created_at": "2025-03-03T12:00:00.000Z",
  "updated_at": "2025-03-03T14:30:00.000Z"
}
```

**Erros**: 400, 401, 403, 404, 502

---

## 5. DELETE /customer/vectors/{id} (excluir vetor)

Remove o vetor do banco de vetores do customer. O vetor deve pertencer ao customer autenticado.

**Path params**: `id` (UUID)

**Fluxo interno**:
1. Validar autenticação e ownership
2. (Opcional) Remover o ficheiro do Blob
3. Eliminar o registo do banco

**Resposta 204**: No content

**Erros**: 401, 403, 404

---

## 6. Modelo de Dados

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| customer_id | UUID | FK para customers |
| original_name | string | Nome do ficheiro original |
| original_url | string | URL da imagem original (opcional, nullable) |
| svg_url | string | URL do SVG vetorizado |
| created_at | timestamp | Data de criação |
| updated_at | timestamp | Data da última atualização |

**Índices sugeridos**:
- `customer_id` (para listar por customer)
- `customer_id + created_at` (para ordenação)
- `customer_id + original_name` (para busca por nome)

---

## 7. Variáveis de Ambiente (API Profissão Laser)

| Variável | Uso |
|----------|-----|
| BLOB_READ_WRITE_TOKEN | Vercel Blob (upload do SVG) |

---

## 8. Exemplos de Request

```bash
# Listar
curl -X GET "https://api.../customer/vectors?page=1&limit=20" \
  -H "Authorization: Bearer <token>"

# Obter um
curl -X GET "https://api.../customer/vectors/{id}" \
  -H "Authorization: Bearer <token>"

# Guardar
curl -X POST "https://api.../customer/vectors" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"svgContent":"<svg>...</svg>","originalName":"logo.png"}'

# Editar
curl -X PATCH "https://api.../customer/vectors/{id}" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"originalName":"meu-logo.svg"}'

# Excluir
curl -X DELETE "https://api.../customer/vectors/{id}" \
  -H "Authorization: Bearer <token>"
```

---

## 9. Regras de Negócio

1. **Autorização**: Validar que o customer tem plano ativo com classe que possui `vetorizacao: true` antes de permitir qualquer operação.

2. **Ownership**: Em GET, PATCH e DELETE por ID, só permitir acesso se `customer_id` do vetor corresponder ao customer autenticado.

3. **Limites** (opcional): Considerar limite de vetores por customer ou por plano.

4. **Blob**: O path sugerido para o SVG é `logos/{timestamp}_{originalName}.svg`. Garantir que o nome do ficheiro no Blob é único (ex.: com UUID ou timestamp).
