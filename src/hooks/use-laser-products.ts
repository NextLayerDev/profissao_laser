'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	createLaserProduct,
	createLaserProductVariant,
	deleteLaserProduct,
	deleteLaserProductVariant,
	getLaserProduct,
	getLaserProducts,
	updateLaserProduct,
	updateLaserProductVariant,
	uploadLaserProductImage,
	uploadLaserProductVariantImage,
} from '@/services/laser-products';
import type {
	CreateLaserProductPayload,
	CreateLaserProductVariantPayload,
	LaserProductsParams,
	UpdateLaserProductPayload,
	UpdateLaserProductVariantPayload,
} from '@/types/laser-products';

const QUERY_KEY = ['laser-products'] as const;

// ─── Products ───────────────────────────────────────────────────────────────

export function useLaserProducts(params?: LaserProductsParams, enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, params] as const,
		queryFn: () => getLaserProducts(params),
		enabled,
	});
}

export function useLaserProduct(id: string | null, enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'detail', id] as const,
		queryFn: () => {
			if (!id) throw new Error('ID required');
			return getLaserProduct(id);
		},
		enabled: !!id && enabled,
	});
}

export function useCreateLaserProduct() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateLaserProductPayload) =>
			createLaserProduct(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useUpdateLaserProduct() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: UpdateLaserProductPayload;
		}) => updateLaserProduct(id, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useDeleteLaserProduct() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteLaserProduct(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

// ─── Variants ───────────────────────────────────────────────────────────────

export function useCreateLaserProductVariant() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			productId,
			payload,
		}: {
			productId: string;
			payload: CreateLaserProductVariantPayload;
		}) => createLaserProductVariant(productId, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useUpdateLaserProductVariant() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			productId,
			variantId,
			payload,
		}: {
			productId: string;
			variantId: string;
			payload: UpdateLaserProductVariantPayload;
		}) => updateLaserProductVariant(productId, variantId, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useDeleteLaserProductVariant() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			productId,
			variantId,
		}: {
			productId: string;
			variantId: string;
		}) => deleteLaserProductVariant(productId, variantId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useUploadLaserProductVariantImage() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			productId,
			variantId,
			file,
		}: {
			productId: string;
			variantId: string;
			file: File;
		}) => uploadLaserProductVariantImage(productId, variantId, file),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useUploadLaserProductImage() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, file }: { id: string; file: File }) =>
			uploadLaserProductImage(id, file),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}
