/**
 * MIGRAÇÃO — Onda 1 · módulo `subscriptions`
 * Origem legada: src/services/addons.ts
 *
 * Checklist (ver docs/MIGRATION.md):
 *  [ ] Portar funções de src/services/addons.ts para cá, trocando o client
 *      `@/lib/fetch` (api) por `@/shared/lib/api-courses` (apiCourses).
 *  [ ] Validar respostas com schema Zod de ../types/addons.
 *  [ ] Mover hooks relacionados -> ../hooks/use-addons.ts (exportar queryKey).
 *  [ ] Exportar no index.ts do módulo.
 *  [ ] Atualizar imports dos consumidores para '@/modules/subscriptions'.
 *  [ ] Deletar src/services/addons.ts e src/types/addons.ts.
 *  [ ] biome check --write + build limpo.
 *
 * Padrão de referência: modules/courses/services/courses.service.ts
 */

// import { apiCourses as api } from '@/shared/lib/api-courses';
// import { type Addon, addonSchema } from '../types/addons';

export {};
