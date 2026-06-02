'use client';

import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
	CommunityParametersQueryParams,
	CreateParameterPayload,
	ParametersQueryParams,
} from '@/services/parameters';
import {
	createParameter,
	deleteParameter,
	exportParameters,
	getCommunityParameters,
	getMySubmissions,
	getParameterMachines,
	getParameterMaterials,
	getParameterOptions,
	getParameterPasses,
	getParameterSidebar,
	getParameterStats,
	getParameters,
	getPendingParameters,
	likeParameter,
	rateParameter,
	reviewParameter,
	saveParameter,
	submitParameter,
	unsaveParameter,
	updateParameter,
	uploadParameterImage,
} from '@/services/parameters';

const QUERY_KEY = ['parameters'] as const;

export function useParameters(params?: ParametersQueryParams, enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'list', params] as const,
		queryFn: () => getParameters(params),
		placeholderData: keepPreviousData,
		enabled,
	});
}

export function useCommunityParameters(
	params?: CommunityParametersQueryParams,
	enabled = true,
) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'community', params] as const,
		queryFn: () => getCommunityParameters(params),
		placeholderData: keepPreviousData,
		staleTime: 5 * 60_000,
		enabled,
	});
}

export function useParameterStats(enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'stats'] as const,
		queryFn: getParameterStats,
		staleTime: 5 * 60_000,
		enabled,
	});
}

export function useParameterPasses(id: string | null, enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'passes', id] as const,
		queryFn: () => {
			if (!id) throw new Error('ID required');
			return getParameterPasses(id);
		},
		enabled: !!id && enabled,
	});
}

export function useParameterSidebar(enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'sidebar'] as const,
		queryFn: getParameterSidebar,
		staleTime: 5 * 60_000,
		enabled,
	});
}

export function useParameterMachines(enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'machines'] as const,
		queryFn: getParameterMachines,
		staleTime: 5 * 60_000,
		enabled,
	});
}

export function useParameterMaterials(enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'materials'] as const,
		queryFn: getParameterMaterials,
		staleTime: 5 * 60_000,
		enabled,
	});
}

export function useParameterOptions(
	dimension: 'lens' | 'category' | 'color' | 'mode',
	enabled = true,
) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'options', dimension] as const,
		queryFn: () => getParameterOptions(dimension),
		staleTime: 5 * 60_000,
		enabled,
	});
}

export function useCreateParameter() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateParameterPayload) => createParameter(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			toast.success('Parametro criado!');
		},
		onError: () => toast.error('Erro ao criar parametro'),
	});
}

export function useUpdateParameter() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: Partial<CreateParameterPayload>;
		}) => updateParameter(id, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			toast.success('Parametro atualizado!');
		},
		onError: () => toast.error('Erro ao atualizar parametro'),
	});
}

export function useDeleteParameter() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteParameter(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			toast.success('Parametro excluido!');
		},
		onError: () => toast.error('Erro ao excluir parametro'),
	});
}

export function useLikeParameter() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => likeParameter(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useRateParameter() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, rating }: { id: string; rating: number }) =>
			rateParameter(id, rating),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			toast.success('Avaliacao enviada!');
		},
	});
}

export function useSaveParameter() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, saved }: { id: string; saved: boolean }) =>
			saved ? unsaveParameter(id) : saveParameter(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useUploadParameterImage() {
	return useMutation({
		mutationFn: (file: File) => uploadParameterImage(file),
		onError: () => toast.error('Erro ao subir imagem'),
	});
}

export function useExportParameters() {
	return useMutation({
		mutationFn: (params?: ParametersQueryParams) => exportParameters(params),
		onSuccess: (blob) => {
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'parametros.csv';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			toast.success('Exportacao concluida!');
		},
		onError: () => toast.error('Erro ao exportar'),
	});
}

// ─── Member submission + Admin review (Fase 4) ───────────────────────────────

/** Membro envia um parâmetro p/ análise. Fica pendente até o admin revisar. */
export function useSubmitParameter() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateParameterPayload) => submitParameter(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			toast.success('Enviado para análise!');
		},
		onError: () => toast.error('Erro ao enviar parametro'),
	});
}

/** Submissões do próprio membro (com status + reviewNote). */
export function useMySubmissions(enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'mine'] as const,
		queryFn: getMySubmissions,
		enabled,
	});
}

/** Fila de análise do admin (submissões pendentes). */
export function usePendingParameters(
	params?: ParametersQueryParams,
	enabled = true,
) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'pending', params] as const,
		queryFn: () => getPendingParameters(params),
		placeholderData: keepPreviousData,
		enabled,
	});
}

/** Admin aprova/rejeita uma submissão. Invalida a fila e a comunidade. */
export function useReviewParameter() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			body,
		}: {
			id: string;
			body: { action: 'approve' | 'reject'; reviewNote?: string };
		}) => reviewParameter(id, body),
		onSuccess: (_data, { body }) => {
			qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'pending'] });
			qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'community'] });
			toast.success(
				body.action === 'approve'
					? 'Parametro aprovado!'
					: 'Parametro rejeitado',
			);
		},
		onError: () => toast.error('Erro ao revisar parametro'),
	});
}
