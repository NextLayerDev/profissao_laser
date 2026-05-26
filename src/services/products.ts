import { getToken } from '@/shared/lib/auth';
import { api } from '@/shared/lib/fetch';
import { type Product, productSchema } from '@/types/products';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface CreateProductPayload {
	name: string;
	type: 'curso';
	description: string;
	price: number;
	interval: 'one_time' | 'month' | 'year' | 'week';
	slug: string;
	language: string;
	country: string;
	category?: string;
	refundDays: number;
	machine?: string;
	software?: string;
}

export async function getProducts(): Promise<Product[]> {
	const { data } = await api.get('/v1/laser-products');
	return productSchema.array().parse(data);
}

export async function createProduct(
	payload: CreateProductPayload,
): Promise<Product> {
	const { data } = await api.post('/v1/laser-product', payload);
	return productSchema.parse(data);
}

export async function deleteProduct(id: string): Promise<void> {
	await api.delete(`/v1/laser-product/${id}`);
}

export interface UpdateProductPayload {
	name?: string;
	description?: string;
	category?: string;
	price?: number;
	refundDays?: number;
	machine?: string;
	software?: string;
}

export async function updateProduct(
	id: string,
	payload: UpdateProductPayload,
): Promise<Product> {
	const { data } = await api.patch(`/v1/laser-product/${id}`, payload);
	return productSchema.parse(data);
}

export async function updateProductStatus(
	id: string,
	active: boolean,
): Promise<void> {
	await api.patch(`/v1/laser-product/${id}/status`, { active });
}

export async function uploadProductImage(
	id: string,
	file: File,
): Promise<Product> {
	const formData = new FormData();
	formData.append('file', file, file.name);

	const token = getToken();
	const headers: Record<string, string> = {};
	if (token) headers.Authorization = `Bearer ${token}`;

	const res = await fetch(`${API_URL}/v1/laser-product/${id}/image`, {
		method: 'POST',
		headers,
		body: formData,
	});

	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err?.message ?? `Upload falhou: ${res.status}`);
	}

	const data = await res.json();
	return productSchema.parse(data);
}
