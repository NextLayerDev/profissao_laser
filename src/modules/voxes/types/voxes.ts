import { z } from 'zod';

export const voxPackageSchema = z.object({
	id: z.string(),
	name: z.string(),
	vox_amount: z.number().int().nonnegative(),
	price_cents: z.number().int().nonnegative(),
	stripe_price_id: z.string().nullable(),
	published: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
});
export type VoxPackage = z.infer<typeof voxPackageSchema>;

export const voxLedgerReasonSchema = z.enum([
	'purchase',
	'spend',
	'refund',
	'adjustment',
]);
export type VoxLedgerReason = z.infer<typeof voxLedgerReasonSchema>;

export const voxLedgerEntrySchema = z.object({
	id: z.string(),
	customer_id: z.string(),
	delta: z.number().int(),
	reason: voxLedgerReasonSchema,
	ref_type: z.string().nullable(),
	ref_id: z.string().nullable(),
	created_at: z.string(),
});
export type VoxLedgerEntry = z.infer<typeof voxLedgerEntrySchema>;

export const myVoxesResponseSchema = z.object({
	balance: z.number().int().nonnegative(),
	ledger: z.array(voxLedgerEntrySchema),
});
export type MyVoxesResponse = z.infer<typeof myVoxesResponseSchema>;

export const purchaseVoxesPayloadSchema = z.object({
	package_id: z.string(),
});
export type PurchaseVoxesPayload = z.infer<typeof purchaseVoxesPayloadSchema>;

export const purchaseVoxesResponseSchema = z.object({
	checkout_url: z.string().url(),
});
export type PurchaseVoxesResponse = z.infer<typeof purchaseVoxesResponseSchema>;

// ─── Admin ──────────────────────────────────────────────

export const createVoxPackageSchema = z.object({
	name: z.string().min(1),
	vox_amount: z.number().int().positive(),
	price_cents: z.number().int().nonnegative(),
	published: z.boolean().optional(),
});
export type CreateVoxPackagePayload = z.infer<typeof createVoxPackageSchema>;

export const updateVoxPackageSchema = createVoxPackageSchema.partial();
export type UpdateVoxPackagePayload = z.infer<typeof updateVoxPackageSchema>;

export const adjustVoxesSchema = z.object({
	customer_id: z.string(),
	delta: z.number().int(),
	note: z.string().min(1).optional(),
});
export type AdjustVoxesPayload = z.infer<typeof adjustVoxesSchema>;

export const adjustVoxesResponseSchema = z.object({
	customer_id: z.string(),
	balance: z.number().int().nonnegative(),
});
export type AdjustVoxesResponse = z.infer<typeof adjustVoxesResponseSchema>;

export const VOX_LEDGER_REASON_LABELS: Record<VoxLedgerReason, string> = {
	purchase: 'Compra',
	spend: 'Uso de ferramenta',
	refund: 'Reembolso',
	adjustment: 'Ajuste',
};
