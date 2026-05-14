import { api } from '@/lib/fetch';
import {
	type CreateAddonPayload,
	type RemoveAddonResponse,
	removeAddonResponseSchema,
	type SubscriptionAddonItem,
	subscriptionAddonItemSchema,
} from '@/types/addons';
import { type Product, productSchema } from '@/types/products';

export async function createAddon(
	payload: CreateAddonPayload,
): Promise<Product> {
	const { data } = await api.post('/addon', payload);
	return productSchema.parse(data);
}

export async function attachAddon(
	productId: string,
): Promise<SubscriptionAddonItem> {
	const { data } = await api.post('/subscription/addon', { productId });
	return subscriptionAddonItemSchema.parse(data);
}

export async function listMyAddons(): Promise<SubscriptionAddonItem[]> {
	const { data } = await api.get('/subscription/addons');
	return subscriptionAddonItemSchema.array().parse(data);
}

export async function removeAddon(
	itemId: string,
): Promise<RemoveAddonResponse> {
	const { data } = await api.delete(`/subscription/addon/${itemId}`);
	return removeAddonResponseSchema.parse(data);
}
