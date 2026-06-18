/**
 * MIGRAÇÃO — Onda 1 · módulo `catalog`
 * Origem legada: src/services/products.ts
 *
 * Checklist (ver docs/MIGRATION.md):
 *  [ ] Portar funções de src/services/products.ts, trocando `@/lib/fetch`
 *      por `@/shared/lib/api-courses` (apiCourses).
 *  [ ] Validar respostas com schema Zod de ../types/products.
 *  [ ] Mover hooks relacionados -> ../hooks/use-products.ts (exportar queryKey).
 *  [ ] Exportar no index.ts do módulo.
 *  [ ] Atualizar imports dos consumidores para '@/modules/catalog'.
 *  [ ] Deletar src/services/products.ts e tipos legados de produto.
 *  [ ] biome check --write + build limpo.
 *
 * Padrão de referência: modules/catalog/services/catalog.service.ts
 */

// import { apiCourses as api } from '@/shared/lib/api-courses';
// import { type Product, productSchema } from '../types/products';

export {};
