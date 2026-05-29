import { z } from 'zod';

/** Curso na vitrine pública (GET /v1/courses). */
export const publicCourseSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string(),
	description: z.string().nullable().optional(),
	image_url: z.string().nullable().optional(),
	published: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
});
export type PublicCourse = z.infer<typeof publicCourseSchema>;

/** Tool incluída num plano, na visão pública do curso. */
export const catalogToolSchema = z.object({
	free_quota: z.number().int().nullable().optional(),
	tool: z.object({
		id: z.string(),
		key: z.string(),
		name: z.string(),
		description: z.string().nullable().optional(),
		vox_cost: z.number().int(),
	}),
});

/** Plano oferecido para um curso, na visão pública (GET /v1/course/{slug}). */
export const catalogCoursePlanSchema = z.object({
	plan: z.object({
		id: z.string(),
		key: z.string(),
		name: z.string(),
		description: z.string().nullable().optional(),
		price_monthly_cents: z.number().int(),
		price_yearly_cents: z.number().int(),
	}),
	published: z.boolean(),
	tools: catalogToolSchema.array(),
});

export const publicCourseDetailSchema = publicCourseSchema.extend({
	plans: catalogCoursePlanSchema.array(),
});
export type PublicCourseDetail = z.infer<typeof publicCourseDetailSchema>;

/** Plano de curso retornado por GET /v1/course/{slug}/plans (plano completo). */
export const coursePlanSchema = z.object({
	course_id: z.string(),
	plan_id: z.string(),
	published: z.boolean(),
	plan: z.object({
		id: z.string(),
		key: z.string(),
		name: z.string(),
		description: z.string().nullable().optional(),
		published: z.boolean(),
		price_monthly_cents: z.number().int(),
		price_yearly_cents: z.number().int(),
		stripe_product_id: z.string().nullable().optional(),
		stripe_price_monthly_id: z.string().nullable().optional(),
		stripe_price_yearly_id: z.string().nullable().optional(),
		created_at: z.string(),
		updated_at: z.string(),
	}),
});
export type CoursePlan = z.infer<typeof coursePlanSchema>;
