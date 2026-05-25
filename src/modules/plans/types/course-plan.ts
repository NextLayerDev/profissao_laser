import { z } from 'zod';

export const upsertCoursePlanSchema = z.object({
	price_monthly_cents: z.number().int().min(0).nullable(),
	price_yearly_cents: z.number().int().min(0).nullable(),
	published: z.boolean().optional(),
});
export type UpsertCoursePlanPayload = z.infer<typeof upsertCoursePlanSchema>;

/**
 * Response shape de POST/PATCH /v1/course/:slug/plan/:planKey.
 * O backend devolve a row do course_plan já com os ids do Stripe.
 */
export const coursePlanRowSchema = z
	.object({
		course_id: z.string(),
		plan_id: z.string(),
		price_monthly_cents: z.number().int().nullable(),
		price_yearly_cents: z.number().int().nullable(),
		stripe_price_monthly_id: z.string().nullable().optional(),
		stripe_price_yearly_id: z.string().nullable().optional(),
		published: z.boolean(),
	})
	.passthrough();
export type CoursePlanRow = z.infer<typeof coursePlanRowSchema>;
