import { z } from 'zod';

export const voxUseStatementSchema = z.object({
	id: z.string(),
	payment_id: z.string(),
	method: z.string(),
	status: z.string(),
	payment_cents: z.number(),
	fee_cents: z.number(),
	retained_cents: z.number(),
	carried_cents: z.number(),
	created_at: z.string(),
});

export const voxUseSummarySchema = z.object({
	mode: z.enum(['on_grant', 'on_use']),
	granted_voxes: z.number(),
	granted_cents: z.number(),
	used_voxes: z.number(),
	used_cents: z.number(),
	to_discount_cents: z.number(),
	discounted_cents: z.number(),
	reserved_cents: z.number(),
	use_cap_bps: z.number(),
	netting_cap_bps: z.number(),
	statements: z.array(voxUseStatementSchema),
});

export type VoxUseStatement = z.infer<typeof voxUseStatementSchema>;
export type VoxUseSummary = z.infer<typeof voxUseSummarySchema>;
