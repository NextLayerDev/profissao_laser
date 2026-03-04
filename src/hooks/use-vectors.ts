'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { vectorizeImage } from '@/services/vectorize';
import {
	deleteCustomerVector,
	getCustomerVectors,
	saveVector,
} from '@/services/vectors';

const VECTORS_KEYS = {
	list: (page?: number, limit?: number) =>
		['customer', 'vectors', page, limit] as const,
};

export function useCustomerVectors(params?: { page?: number; limit?: number }) {
	return useQuery({
		queryKey: VECTORS_KEYS.list(params?.page, params?.limit),
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
