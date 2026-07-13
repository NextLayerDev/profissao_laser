'use client';

import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import {
	aiLineartVectorize,
	analyzeVectorize,
	previewVectorize,
	type VectorizeParams,
	vectorizeImage,
} from '@/services/vectorize';
import {
	deleteCustomerVector,
	getCustomerVectors,
	saveVector,
	updateVector,
} from '@/services/vectors';
import { useDebouncedValue } from './use-debounced-value';

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
		placeholderData: keepPreviousData,
		staleTime: 90_000,
	});
}

export function useVectorizeImage() {
	return useMutation({
		mutationFn: ({
			file,
			invocationId,
			params,
		}: {
			file: File;
			invocationId?: string;
			params?: VectorizeParams;
		}) => vectorizeImage(file, { invocationId, params }),
		onSuccess: () => {
			toast.success('Imagem vetorizada com sucesso!');
		},
		// Erros (incl. refund) são tratados pelo orquestrador useRunTool.
	});
}

/**
 * Line-art com IA (foto → gravura via IA → vetor). Cobrada NA GERAÇÃO. Demora
 * ~30–40s. O `useRunTool` orquestra o invoke/settle; aqui só a chamada do motor.
 */
export function useAiLineartVectorize() {
	return useMutation({
		mutationFn: ({
			file,
			invocationId,
			params,
			variant,
		}: {
			file: File;
			invocationId?: string;
			params?: VectorizeParams;
			variant?: 'lineart' | 'color';
		}) => aiLineartVectorize(file, { invocationId, params, variant }),
		onSuccess: () => {
			toast.success('Vetor gerado com IA!');
		},
	});
}

/**
 * Preview ao vivo (NÃO cobrado): conforme os sliders mudam, busca um SVG de
 * preview no backend com debounce. Mantém o último resultado durante o refetch
 * (sem flicker) e não dá retry — o run final cobrado é o `useVectorizeImage`.
 */
export function useVectorizePreview(
	file: File | null,
	params: VectorizeParams,
	enabled: boolean,
) {
	const debouncedParams = useDebouncedValue(params, 400);
	const fileKey = file
		? `${file.name}:${file.size}:${file.lastModified}`
		: null;
	return useQuery({
		queryKey: ['vectorize-preview', fileKey, JSON.stringify(debouncedParams)],
		queryFn: () => previewVectorize(file as File, debouncedParams),
		enabled: enabled && !!file,
		staleTime: 5 * 60_000,
		placeholderData: keepPreviousData,
		retry: false,
	});
}

/**
 * Análise automática (NÃO cobrada): ao subir a imagem, detecta o tipo e devolve
 * os parâmetros recomendados. Dispara uma vez por arquivo; sem retry.
 */
export function useAnalyzeVectorize(file: File | null) {
	const fileKey = file
		? `${file.name}:${file.size}:${file.lastModified}`
		: null;
	return useQuery({
		queryKey: ['vectorize-analyze', fileKey],
		queryFn: () => analyzeVectorize(file as File),
		enabled: !!file,
		staleTime: 10 * 60_000,
		retry: false,
	});
}

/**
 * Guarda na biblioteca o SVG já vetorizado (sem re-vetorizar/recobrar).
 * Recebe o resultado da vetorização (svgContent + originalName).
 */
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
