# API Gaps 3.0 — Suporte & Vetorizacao

> Endpoints que o frontend consome mas que NAO existem na API atual.
> Verificado contra o openapi.json em 2026-05-15.

---

## 1. Vectorize Help CRUD — OK (IMPLEMENTADO)

Todos os 7 endpoints existem na API. O frontend usa normalizer snake_case → camelCase no service layer (`src/services/vectorize-help.ts`).

---

## 2. Vectorize Export — metodo HTTP divergente

O frontend chama `POST /api/vectorize/export/{format}` enviando `{ svgContent }` no body.
A API documenta `GET /api/vectorize/export/{format}` (sem body).

| Frontend | API | Observacao |
|----------|-----|------------|
| `POST /api/vectorize/export/{format}` | `GET /api/vectorize/export/{format}` | Frontend envia SVG no body, GET nao suporta body. Alinhar para POST ou aceitar ambos. |

---

## 3. Suporte (doubt-chats, FAQs, knowledge-base) — TUDO OK

Todos os endpoints usados pelo frontend existem na API:

| Modulo | Endpoints usados | Status |
|--------|-----------------|--------|
| doubt-chats (customer) | GET /doubt-chats, POST /doubt-chats, GET /doubt-chats/{id}, POST /doubt-chats/{id}/messages | OK |
| doubt-chats (admin) | GET /doubt-chats/admin, GET /doubt-chats/stats, POST /doubt-chats/{id}/assign-random | OK |
| doubt-categories | GET, POST, PATCH, DELETE, reorder | OK |
| doubt-default-questions | PATCH, DELETE + technician endpoints | OK |
| FAQs | GET, POST, PATCH, DELETE, reorder, react | OK |
| Knowledge Base | GET, GET/{id}, POST, PATCH, DELETE | OK |
| Vector Support tickets | GET, POST, GET/{id}, POST messages, POST close, GET admin | OK |

---

## Resumo

| Feature | Qtd endpoints | Status |
|---------|---------------|--------|
| Vectorize Help CRUD + reorder + active | 7 | OK |
| Vectorize Export (POST vs GET) | 1 | **DIVERGENTE** |
| Suporte (doubt-chats, FAQ, KB, vector-support) | ~25 | OK |
