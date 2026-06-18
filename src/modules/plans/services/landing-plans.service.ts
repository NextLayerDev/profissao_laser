/**
 * MIGRAÇÃO — Onda 1 · módulo `plans`
 * Origem legada: src/services/landing-plans.ts
 *
 * Checklist (ver docs/MIGRATION.md):
 *  [ ] Portar funções de src/services/landing-plans.ts, trocando `@/lib/fetch`
 *      por `@/shared/lib/api-courses` (apiCourses).
 *  [ ] Validar respostas com schema Zod de ../types/landing-plans.
 *  [ ] Mover hooks relacionados -> ../hooks/use-landing-plans.ts (exportar queryKey).
 *  [ ] Exportar no index.ts do módulo.
 *  [ ] Atualizar imports dos consumidores para '@/modules/plans'.
 *  [ ] Deletar src/services/landing-plans.ts.
 *  [ ] biome check --write + build limpo.
 *
 * Padrão de referência: modules/plans/services/plans.service.ts
 */

// import { apiCourses as api } from '@/shared/lib/api-courses';
// import { type LandingPlan, landingPlanSchema } from '../types/landing-plans';

export {};
