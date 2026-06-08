import { z } from 'zod';

export const upsertCoursePlanSchema = z.object({
	published: z.boolean().optional(),
});
export type UpsertCoursePlanPayload = z.infer<typeof upsertCoursePlanSchema>;

/**
 * Response shape de POST/PATCH /v1/course/:slug/plan/:planKey.
 * O backend devolve a row do course_plan (apenas vínculo + published).
 * Preços agora vivem no próprio Plan.
 */
export const coursePlanRowSchema = z
	.object({
		course_id: z.string(),
		plan_id: z.string(),
		published: z.boolean(),
	})
	.passthrough();
export type CoursePlanRow = z.infer<typeof coursePlanRowSchema>;
