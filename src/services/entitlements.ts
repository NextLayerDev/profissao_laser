import { z } from 'zod';
import { apiCourses } from '@/shared/lib/api-courses';

/**
 * Consolidated "what the customer bought" from upvox (`GET /v1/me/entitlements`).
 * The single source of truth for access gating: active plan, accessible courses,
 * per-tool access (free_quota/remaining_free/vox_cost), vox balance and the
 * test-unlimited flag. Access is 100% plan-driven — no active plan ⇒ só tools
 * `is_free`, listadas como view-only (`entitled: false`): dá pra VER a página
 * (GETs liberados), mas usar/rodar (use/invoke) continua exigindo plano.
 */
export const entitlementToolSchema = z.object({
	key: z.string(),
	name: z.string(),
	entitled: z.boolean(),
	free_quota: z.number().nullable(), // null = ilimitado
	remaining_free: z.number().nullable(),
	vox_cost: z.number(),
	/** Visível/consultável sem assinatura (só leitura). */
	is_free: z.boolean().default(false),
});
export type EntitlementTool = z.infer<typeof entitlementToolSchema>;

export const entitlementsSchema = z.object({
	is_test_unlimited: z.boolean(),
	vox_balance: z.number(),
	subscription: z
		.object({
			status: z.string(),
			plan: z.object({ id: z.string(), key: z.string(), name: z.string() }),
			current_period_start: z.string(),
			current_period_end: z.string(),
			vox_monthly_grant: z.number(),
		})
		.nullable(),
	courses: z.array(
		z.object({ id: z.string(), slug: z.string(), title: z.string() }),
	),
	tools: z.array(entitlementToolSchema),
});
export type Entitlements = z.infer<typeof entitlementsSchema>;

/** Pass `courseSlug` to get exact `remaining_free` for that course. */
export async function getEntitlements(
	courseSlug?: string,
): Promise<Entitlements> {
	const { data } = await apiCourses.get('/v1/me/entitlements', {
		params: courseSlug ? { course_slug: courseSlug } : undefined,
	});
	return entitlementsSchema.parse(data);
}
