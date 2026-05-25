import { z } from 'zod';

/**
 * Body de POST/PATCH /v1/course/:slug/plan/:planKey.
 * Preços foram removidos — eles agora pertencem ao plano, não ao vínculo.
 */
export const upsertCoursePlanSchema = z.object({
	published: z.boolean().optional(),
});
export type UpsertCoursePlanPayload = z.infer<typeof upsertCoursePlanSchema>;

/**
 * Response shape de POST/PATCH /v1/course/:slug/plan/:planKey.
 * O backend devolve a row do course_plan sem preços (eles estão no plan).
 */
export const coursePlanRowSchema = z
	.object({
		course_id: z.string(),
		plan_id: z.string(),
		published: z.boolean(),
	})
	.passthrough();
export type CoursePlanRow = z.infer<typeof coursePlanRowSchema>;
