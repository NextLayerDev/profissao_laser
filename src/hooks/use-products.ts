'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	type CreateProductPayload,
	createProduct,
	getProducts,
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
