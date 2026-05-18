'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
	createProductParameter,
	deleteProductParameter,
	getProductParameters,
	lookupProductParameter,
	updateProductParameter,
} from '@/services/product-parameters';
import type {
	CreateProductParameterPayload,
	ParameterLookupParams,
	UpdateProductParameterPayload,
} from '@/types/product-parameters';

const QUERY_KEY = ['product-parameters'] as const;

// ─── Queries ────────────────────────────────────────────────────────────────

export function useProductParameters(productId: string | null, enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, productId] as const,
		queryFn: () => {
			if (!productId) throw new Error('Product ID required');
			return getProductParameters(productId);
		},
		enabled: !!productId && enabled,
	});
}

export function useParameterLookup(
	productId: string | null,
	params?: ParameterLookupParams,
	enabled = true,
) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'lookup', productId, params] as const,
		queryFn: () => {
			if (!productId) throw new Error('Product ID required');
			return lookupProductParameter(productId, params);
		},
		enabled: !!productId && enabled,
	});
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export function useCreateProductParameter() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			productId,
			payload,
		}: {
			productId: string;
			payload: CreateProductParameterPayload;
		}) => createProductParameter(productId, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			toast.success('Parametro associado!');
		},
		onError: () => toast.error('Erro ao associar parametro'),
	});
}

export function useUpdateProductParameter() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			productId,
			assocId,
			payload,
		}: {
			productId: string;
			assocId: string;
			payload: UpdateProductParameterPayload;
		}) => updateProductParameter(productId, assocId, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			toast.success('Associacao atualizada!');
		},
		onError: () => toast.error('Erro ao atualizar associacao'),
	});
}

export function useDeleteProductParameter() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			productId,
			assocId,
		}: {
			productId: string;
			assocId: string;
		}) => deleteProductParameter(productId, assocId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			toast.success('Associacao excluida!');
		},
		onError: () => toast.error('Erro ao excluir associacao'),
	});
}
