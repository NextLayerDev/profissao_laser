'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
	deletePrevia,
	deleteWatermark,
	generatePrevia,
	getPreviaOptions,
	getPreviasAdminUsage,
	getPreviasHistory,
	getPreviasQuota,
	getWatermark,
	updatePrevia,
	uploadWatermark,
} from '@/services/previas';
import type {
	GeneratePreviaPayload,
	UpdatePreviaPayload,
} from '@/types/previas';

const QUERY_KEY = ['previas'] as const;
const QUOTA_KEY = ['previas', 'quota'] as const;
const OPTIONS_KEY = ['previas', 'options'] as const;

export function usePreviaOptions(enabled = true) {
	return useQuery({
		queryKey: OPTIONS_KEY,
		queryFn: getPreviaOptions,
		staleTime: Infinity,
		enabled,
	});
}

export function usePreviasQuota() {
	return useQuery({
		queryKey: QUOTA_KEY,
		queryFn: getPreviasQuota,
		refetchInterval: 60_000,
		staleTime: 30_000,
	});
}

export function useGeneratePrevia() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: GeneratePreviaPayload) => generatePrevia(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			qc.invalidateQueries({ queryKey: QUOTA_KEY });
			toast.success('Previa gerada com sucesso!');
		},
		onError: () => toast.error('Erro ao gerar previa'),
	});
}

export function usePreviasHistory(page?: number, limit?: number) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'history', page, limit] as const,
		queryFn: () => getPreviasHistory({ page, limit }),
	});
}

export function useUpdatePrevia() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: UpdatePreviaPayload;
		}) => updatePrevia(id, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			toast.success('Previa atualizada!');
		},
		onError: () => toast.error('Erro ao atualizar previa'),
	});
}

export function useDeletePrevia() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deletePrevia(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			toast.success('Previa excluida!');
		},
		onError: () => toast.error('Erro ao excluir previa'),
	});
}

export function usePreviasAdminUsage(
	page?: number,
	limit?: number,
	search?: string,
) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'admin-usage', page, limit, search] as const,
		queryFn: () => getPreviasAdminUsage({ page, limit, search }),
	});
}

// ─── Watermark ──────────────────────────────────────────────────────────────

const WATERMARK_KEY = ['watermark'] as const;

export function useWatermark(enabled = true) {
	return useQuery({
		queryKey: WATERMARK_KEY,
		queryFn: getWatermark,
		enabled,
		retry: false,
	});
}

export function useUploadWatermark() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (file: File) => uploadWatermark(file),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: WATERMARK_KEY });
			toast.success("Marca d'agua atualizada!");
		},
		onError: () => toast.error("Erro ao enviar marca d'agua"),
	});
}

export function useDeleteWatermark() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => deleteWatermark(),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: WATERMARK_KEY });
			toast.success("Marca d'agua removida!");
		},
		onError: () => toast.error("Erro ao remover marca d'agua"),
	});
}
