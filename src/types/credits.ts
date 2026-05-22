import { z } from 'zod';

export type VoxFeature = 'previa' | 'vectorize' | 'editor-ai';

export const voxBalanceSchema = z.object({
	balance: z.number(),
});
export type VoxBalance = z.infer<typeof voxBalanceSchema>;

export const voxCostSchema = z.object({
	feature: z.string(),
	cost: z.number(),
	label: z.string(),
});
export type VoxCost = z.infer<typeof voxCostSchema>;

export const voxPackageSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
	credits: z.number(),
	price: z.number(),
	active: z.boolean().optional(),
});
export type VoxPackage = z.infer<typeof voxPackageSchema>;

export const voxHistoryEntrySchema = z.object({
	id: z.string(),
	type: z.enum(['purchase', 'debit', 'refund', 'adjustment']),
	amount: z.number(),
	balanceAfter: z.number(),
	feature: z.string().nullable().optional(),
	createdAt: z.string(),
});
export type VoxHistoryEntry = z.infer<typeof voxHistoryEntrySchema>;

export const voxHistoryResponseSchema = z.object({
	data: z.array(voxHistoryEntrySchema),
	total: z.number(),
	page: z.number(),
	limit: z.number(),
});
export type VoxHistoryResponse = z.infer<typeof voxHistoryResponseSchema>;

export const voxCheckoutResponseSchema = z.object({
	checkoutUrl: z.string(),
	sessionId: z.string(),
});
export type VoxCheckoutResponse = z.infer<typeof voxCheckoutResponseSchema>;

// Erro 402 (confirmation_required | insufficient_balance)
export interface Vox402 {
	message: string;
	reason: 'confirmation_required' | 'insufficient_balance';
	feature: VoxFeature;
	cost: number;
	balance: number;
}

// Quota grátis (limite por feature pra usuários sem voxes)
export const featureQuotaSchema = z.object({
	feature: z.enum(['previa', 'vectorize', 'editor-ai']),
	isFree: z.boolean(),
	limit: z.number().int(),
	used: z.number().int(),
	remaining: z.number().int(),
	period: z.enum(['daily', 'weekly']),
	resetsAt: z.string(),
});
export type FeatureQuota = z.infer<typeof featureQuotaSchema>;

export const quotaResponseSchema = z.object({
	balance: z.number().int(),
	quotas: z.array(featureQuotaSchema),
});
export type QuotaResponse = z.infer<typeof quotaResponseSchema>;

// Erro 429 (limite grátis atingido — só para usuários com balance 0)
export interface VoxFreeTierLimit429 {
	message: string;
	code: 'FREE_TIER_LIMIT_REACHED';
	feature: VoxFeature;
	limit: number;
	used: number;
	remaining: number;
	period: 'daily' | 'weekly';
	resetsAt: string;
	balance: number;
}

// Payloads admin
export interface CreateVoxPackagePayload {
	name: string;
	description?: string;
	credits: number;
	price: number;
}
export interface UpdateVoxPackagePayload {
	name?: string;
	description?: string;
	credits?: number;
	price?: number;
}
export interface AdjustVoxPayload {
	customerId: string;
	amount: number;
	reason: string;
}
