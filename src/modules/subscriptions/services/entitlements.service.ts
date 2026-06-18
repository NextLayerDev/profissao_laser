/**
 * MIGRAÇÃO — Onda 1 · módulo `subscriptions`
 * Origem legada: src/services/entitlements.ts
 *
 * Checklist (ver docs/MIGRATION.md):
 *  [ ] Portar funções de src/services/entitlements.ts, trocando `@/lib/fetch`
 *      por `@/shared/lib/api-courses` (apiCourses).
 *  [ ] Validar respostas com schema Zod de ../types/entitlements.
 *  [ ] Mover hooks relacionados -> ../hooks/use-entitlements.ts (exportar queryKey).
 *  [ ] Exportar no index.ts do módulo.
 *  [ ] Atualizar imports dos consumidores para '@/modules/subscriptions'.
 *  [ ] Deletar src/services/entitlements.ts e src/types/entitlements.ts.
 *  [ ] biome check --write + build limpo.
 *
 * Atenção: entitlements é lógica crítica — escrever testes (Vitest) antes de
 * mexer (ver Onda 4 em docs/ARCHITECTURE.md).
 */

// import { apiCourses as api } from '@/shared/lib/api-courses';
// import { type Entitlement, entitlementSchema } from '../types/entitlements';

export {};
