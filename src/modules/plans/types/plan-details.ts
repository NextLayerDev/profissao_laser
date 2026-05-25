import { z } from 'zod';
import { planSchema } from './plans';

/**
 * Resposta de GET /v1/plan/:id/details (admin/staff).
 * Agrega plan (com preços) + entitlements (com metadado da tool) + cursos
 * vinculados (sem preços — eles estão em plan.price_*), tudo em um request.
 */

// ─── Tool embedded no entitlement ─────────────────────────────────
export const planDetailsToolMetaSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
	vox_cost: z.number().int(),
	enabled: z.boolean(),
});
export type PlanDetailsToolMeta = z.infer<typeof planDetailsToolMetaSchema>;

export const planEntitlementSchema = z.object({
	tool_key: z.string(),
	free_quota: z.number().int().nullable(),
	tool: planDetailsToolMetaSchema,
});
export type PlanEntitlement = z.infer<typeof planEntitlementSchema>;

// ─── Curso embedded ───────────────────────────────────────────────
export const planDetailsCourseMetaSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string(),
	image_url: z.string().nullable().optional(),
});

export const planDetailsCoursePlanSchema = z.object({
	published: z.boolean(),
});

export const planDetailsCourseSchema = z.object({
	course: planDetailsCourseMetaSchema,
	course_plan: planDetailsCoursePlanSchema,
});
export type PlanDetailsCourse = z.infer<typeof planDetailsCourseSchema>;

// ─── Response root ────────────────────────────────────────────────
export const planDetailsSchema = z.object({
	plan: planSchema,
	tools: z.array(planEntitlementSchema),
	courses: z.array(planDetailsCourseSchema),
});
export type PlanDetails = z.infer<typeof planDetailsSchema>;
