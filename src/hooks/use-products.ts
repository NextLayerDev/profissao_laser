'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	type CreateProductPayload,
	createProduct,
	deleteProduct,
	getProducts,
	type UpdateProductPayload,
	updateProduct,
} from '@/services/products';
import type { Product } from '@/types/products';

export function useProducts() {
	const { data, error, isLoading } = useQuery({
		queryKey: ['products'],
		queryFn: getProducts,
	});

	return {
		products: data as Product[],
		error,
		isLoading,
	};
}

export function useCreateProduct() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateProductPayload) => createProduct(payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
	});
}

export function useDeleteProduct() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteProduct(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
	});
}

export function useUpdateProduct() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: UpdateProductPayload;
		}) => updateProduct(id, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
	});
}
