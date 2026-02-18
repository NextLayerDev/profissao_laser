import { api } from '@/lib/fetch';
import { type Product, productSchema } from '@/types/products';

export interface CreateProductPayload {
	name: string;
	type: 'curso';
	description: string;
	image: string;
	price: number;
	interval: 'one_time' | 'month' | 'year' | 'week';
	slug: string;
	language: string;
	country: string;
	category: string;
	refundDays: number;
}

export async function getProducts(): Promise<Product[]> {
	const { data } = await api.get('/products');
	return productSchema.array().parse(data);
}

export async function createProduct(
	payload: CreateProductPayload,
): Promise<Product> {
	const { data } = await api.post('/product', payload);
	return productSchema.parse(data);
}

export async function deleteProduct(id: string): Promise<void> {
	await api.delete(`/product/${id}`);
}
