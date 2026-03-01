import { api } from '@/lib/fetch';
import { type Product, productSchema } from '@/types/products';

export interface CreateProductPayload {
	name: string;
	type: 'curso';
	description: string;
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

export interface UpdateProductPayload {
	name?: string;
	description?: string;
	category?: string;
	price?: number;
	refundDays?: number;
}

export async function updateProduct(
	id: string,
	payload: UpdateProductPayload,
): Promise<Product> {
	const { data } = await api.patch(`/product/${id}`, payload);
	return productSchema.parse(data);
}

export async function updateProductStatus(
	id: string,
	active: boolean,
): Promise<void> {
	await api.patch(`/product/${id}/status`, { active });
}

export async function uploadProductImage(
	id: string,
	file: File,
): Promise<Product> {
	const formData = new FormData();
	formData.append('file', file);
	const { data } = await api.post(`/product/${id}/image`, formData, {
		headers: { 'Content-Type': undefined },
	});
	return productSchema.parse(data);
}
