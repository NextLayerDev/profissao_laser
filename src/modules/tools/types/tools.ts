import { z } from 'zod';

export const toolSchema = z.object({
	id: z.string(),
	key: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
	vox_cost: z.coerce.number(),
	/** Custo real da plataforma por uso (cents) — alimenta a fatura aberta dos Links de Plano. */
	platform_cost_cents: z.coerce.number().optional().default(0),
	enabled: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
});
export type Tool = z.infer<typeof toolSchema>;

export const createToolSchema = z.object({
	key: z
		.string()
		.min(1)
		.max(60)
		.regex(/^[a-z0-9_]+$/, 'snake_case (a-z, 0-9, _)'),
	name: z.string().min(1).max(120),
	description: z.string().max(1000).optional(),
	vox_cost: z.number().min(0).optional(),
	platform_cost_cents: z.number().int().min(0).optional(),
	enabled: z.boolean().optional(),
});
export type CreateToolPayload = z.infer<typeof createToolSchema>;

export const updateToolSchema = createToolSchema.partial();
export type UpdateToolPayload = z.infer<typeof updateToolSchema>;

export const invokeToolResultSchema = z.object({
	invocation_id: z.string(),
	quota_consumed: z.number().int(),
	voxes_spent: z.coerce.number(),
	balance: z.coerce.number(),
});
export type InvokeToolResult = z.infer<typeof invokeToolResultSchema>;
