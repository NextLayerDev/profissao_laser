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

// Erro 429 (somente prévia)
export interface VoxDailyLimit429 {
	code: 'DAILY_LIMIT_REACHED';
	limit: number;
	used: number;
	resetsAt: string;
	creditOption: {
		cost: number;
		balance: number;
		canUseCredits: boolean;
	} | null;
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
