import { z } from 'zod';

export const courseSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string(),
	description: z.string().nullable().optional(),
	image_url: z.string().nullable().optional(),
	published: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
});
export type Course = z.infer<typeof courseSchema>;

export const createCourseSchema = z.object({
	slug: z
		.string()
		.min(1)
		.max(80)
		.regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, 'slug em kebab-case'),
	title: z.string().min(1).max(200),
	description: z.string().max(2000).optional(),
	published: z.boolean().optional(),
});
export type CreateCoursePayload = z.infer<typeof createCourseSchema>;

export const updateCourseSchema = createCourseSchema.partial();
export type UpdateCoursePayload = z.infer<typeof updateCourseSchema>;

// ─── CourseDetail (GET /v1/courses) ──────────────────────

export const courseDetailToolSchema = z.object({
	free_quota: z.number().int().nullable(),
	tool: z.object({
		key: z.string(),
		name: z.string(),
		vox_cost: z.number(),
	}),
});
export type CourseDetailTool = z.infer<typeof courseDetailToolSchema>;

export const courseDetailPlanSchema = z.object({
	plan: z.object({
		id: z.string(),
		key: z.string(),
		name: z.string(),
		price_monthly_cents: z.number().int().nullable(),
		price_yearly_cents: z.number().int().nullable(),
	}),
	published: z.boolean(),
	tools: z.array(courseDetailToolSchema),
});
export type CourseDetailPlan = z.infer<typeof courseDetailPlanSchema>;

export const courseDetailSchema = courseSchema.extend({
	plans: z.array(courseDetailPlanSchema),
});
export type CourseDetail = z.infer<typeof courseDetailSchema>;
