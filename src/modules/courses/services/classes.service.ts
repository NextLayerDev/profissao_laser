/**
 * MIGRAÇÃO — Onda 1 · módulo `courses`
 * Origem legada: src/services/classes.ts (+ src/services/system-classes.ts)
 *
 * Checklist (ver docs/MIGRATION.md):
 *  [ ] Portar funções de classes.ts e system-classes.ts, trocando `@/lib/fetch`
 *      por `@/shared/lib/api-courses` (apiCourses).
 *  [ ] Validar respostas com schema Zod de ../types/classes.
 *  [ ] Mover hooks relacionados -> ../hooks/use-classes.ts (exportar queryKey).
 *  [ ] Exportar no index.ts do módulo.
 *  [ ] Atualizar imports dos consumidores para '@/modules/courses'.
 *  [ ] Deletar src/services/classes.ts, src/services/system-classes.ts e src/types/classes.ts.
 *  [ ] biome check --write + build limpo.
 *
 * Padrão de referência: modules/courses/services/courses.service.ts
 */

// import { apiCourses as api } from '@/shared/lib/api-courses';
// import { type Class, classSchema } from '../types/classes';

export {};
