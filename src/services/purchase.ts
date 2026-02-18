import { api } from '@/lib/fetch';
import {
	type PurchasePayload,
	type PurchaseResponse,
	purchaseResponseSchema,
} from '@/types/purchase';

export async function createPurchase(
	payload: PurchasePayload,
): Promise<PurchaseResponse> {
	const { data } = await api.post('/purchase', payload);
	return purchaseResponseSchema.parse(data);
}
