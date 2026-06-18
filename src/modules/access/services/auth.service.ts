/**
 * MIGRAÇÃO — Onda 1 · módulo `access`
 * Origem legada: src/services/auth.ts
 *
 * Checklist (ver docs/MIGRATION.md):
 *  [ ] Portar funções de src/services/auth.ts, trocando `@/lib/fetch`
 *      por `@/shared/lib/api-courses` (apiCourses).
 *  [ ] Validar respostas com schema Zod de ../types/auth.
 *  [ ] Mover hooks relacionados -> ../hooks/use-auth.ts (exportar queryKey).
 *  [ ] Exportar no index.ts do módulo.
 *  [ ] Atualizar imports dos consumidores para '@/modules/access'.
 *  [ ] Deletar src/services/auth.ts e src/types/auth.ts.
 *  [ ] biome check --write + build limpo.
 *
 * Atenção: NÃO mover src/lib/auth.ts (gestão de tokens) — é infra compartilhada.
 * Escrever testes (Vitest) antes de mexer (ver Onda 4 em docs/ARCHITECTURE.md).
 */

// import { apiCourses as api } from '@/shared/lib/api-courses';
// import { type LoginResponse, loginResponseSchema } from '../types/auth';

export {};
