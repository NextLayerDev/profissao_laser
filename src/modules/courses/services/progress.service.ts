/**
 * MIGRAÇÃO — Onda 1 · módulo `courses`
 * Origem legada: src/services/progress.ts
 *
 * Checklist (ver docs/MIGRATION.md):
 *  [ ] Portar funções de src/services/progress.ts, trocando `@/lib/fetch`
 *      por `@/shared/lib/api-courses` (apiCourses).
 *  [ ] Validar respostas com schema Zod (criar ../types/progress se preciso).
 *  [ ] Mover hooks relacionados -> ../hooks/use-progress.ts (exportar queryKey).
 *  [ ] Exportar no index.ts do módulo.
 *  [ ] Atualizar imports dos consumidores para '@/modules/courses'.
 *  [ ] Deletar src/services/progress.ts.
 *  [ ] biome check --write + build limpo.
 */

// import { apiCourses as api } from '@/shared/lib/api-courses';

export {};
