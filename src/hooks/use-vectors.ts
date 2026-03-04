'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { vectorizeImage } from '@/services/vectorize';
import {
	deleteCustomerVector,
	getCustomerVectors,
	saveVector,
	updateVector,
} from '@/services/vectors';

const VECTORS_KEYS = {
	list: (page?: number, limit?: number, search?: string) =>
		['customer', 'vectors', page, limit, search] as const,
};

export function useCustomerVectors(params?: {
	page?: number;
	limit?: number;
	search?: string;
	customerId?: string;
}) {
	return useQuery({
		queryKey: VECTORS_KEYS.list(params?.page, params?.limit, params?.search),
		queryFn: () => getCustomerVectors(params),
	});
}

export function useVectorizeImage() {
	return useMutation({
		mutationFn: (file: File) => vectorizeImage(file),
		onSuccess: () => {
			toast.success('Imagem vetorizada com sucesso!');
		},
		onError: () => {
			toast.error('Erro ao vetorizar imagem');
		},
	});
}

export function useSaveVector() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			svgContent,
			originalName,
		}: {
			svgContent: string;
			originalName: string;
		}) => saveVector(svgContent, originalName),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['customer', 'vectors'] });
			toast.success('Vetor guardado!');
		},
		onError: () => {
			toast.error('Erro ao guardar vetor');
		},
	});
}

export function useUpdateVector() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: { originalName?: string; svgContent?: string };
		}) => updateVector(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['customer', 'vectors'] });
			toast.success('Vetor atualizado!');
		},
		onError: () => {
			toast.error('Erro ao atualizar vetor');
		},
	});
}

export function useDeleteCustomerVector() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteCustomerVector(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['customer', 'vectors'] });
			toast.success('Vetor removido');
		},
		onError: () => {
			toast.error('Erro ao remover vetor');
		},
	});
}
