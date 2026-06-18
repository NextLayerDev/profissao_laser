/**
 * MIGRAÇÃO — Onda 1 · módulo `subscriptions`
 * Origem legada: src/services/provisioning.ts
 *
 * Checklist (ver docs/MIGRATION.md):
 *  [ ] Portar funções de src/services/provisioning.ts, trocando `@/lib/fetch`
 *      por `@/shared/lib/api-courses` (apiCourses).
 *  [ ] Validar respostas com schema Zod (criar ../types/provisioning se preciso).
 *  [ ] Mover hooks relacionados -> ../hooks/ (exportar queryKey).
 *  [ ] Exportar no index.ts do módulo.
 *  [ ] Atualizar imports dos consumidores para '@/modules/subscriptions'.
 *  [ ] Deletar src/services/provisioning.ts.
 *  [ ] biome check --write + build limpo.
 */

// import { apiCourses as api } from '@/shared/lib/api-courses';

export {};
