'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { DesignsQueryParams } from '@/services/designs';
import {
	createDesign,
	deleteDesign,
	getDesign,
	getDesigns,
	updateDesign,
	uploadDesignThumbnail,
} from '@/services/designs';
import type { CreateDesignPayload, UpdateDesignPayload } from '@/types/designs';

const QUERY_KEY = ['designs'] as const;

export function useDesigns(params?: DesignsQueryParams) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'list', params] as const,
		queryFn: () => getDesigns(params),
	});
}

export function useDesign(id: string | undefined) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'detail', id] as const,
		queryFn: () => getDesign(id as string),
		enabled: !!id,
	});
}

export function useCreateDesign() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateDesignPayload) => createDesign(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			toast.success('Design criado!');
		},
		onError: () => toast.error('Erro ao criar design'),
	});
}

export function useUpdateDesign() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: UpdateDesignPayload;
		}) => updateDesign(id, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useUploadDesignThumbnail() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, file }: { id: string; file: File }) =>
			uploadDesignThumbnail(id, file),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
		onError: () => toast.error('Erro ao enviar thumbnail'),
	});
}

export function useDeleteDesign() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteDesign(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			toast.success('Design excluido!');
		},
		onError: () => toast.error('Erro ao excluir design'),
	});
}
