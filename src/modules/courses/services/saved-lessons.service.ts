/**
 * MIGRAÇÃO — Onda 1 · módulo `courses`
 * Origem legada: src/services/saved-lessons.ts
 *
 * Checklist (ver docs/MIGRATION.md):
 *  [ ] Portar funções de src/services/saved-lessons.ts, trocando `@/lib/fetch`
 *      por `@/shared/lib/api-courses` (apiCourses).
 *  [ ] Validar respostas com schema Zod (reusar ../types/lessons se aplicável).
 *  [ ] Mover hooks relacionados -> ../hooks/use-saved-lessons.ts (exportar queryKey).
 *  [ ] Exportar no index.ts do módulo.
 *  [ ] Atualizar imports dos consumidores para '@/modules/courses'.
 *  [ ] Deletar src/services/saved-lessons.ts.
 *  [ ] biome check --write + build limpo.
 */

// import { apiCourses as api } from '@/shared/lib/api-courses';

export {};
