'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
	getParameterMachines,
	getParameterMaterials,
	getParameterStats,
	getParameters,
	likeParameter,
	rateParameter,
	saveParameter,
	unsaveParameter,
	updateParameter,
} from '@/services/parameters';

const QUERY_KEY = ['parameters'] as const;

export function useParameters(params?: ParametersQueryParams, enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'list', params] as const,
		queryFn: () => getParameters(params),
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
		enabled,
	});
}

export function useParameterStats(enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'stats'] as const,
		queryFn: getParameterStats,
		enabled,
	});
}

export function useParameterMachines(enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'machines'] as const,
		queryFn: getParameterMachines,
		enabled,
	});
}

export function useParameterMaterials(enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'materials'] as const,
		queryFn: getParameterMaterials,
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
