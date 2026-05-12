'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { TemplatesQueryParams } from '@/services/templates';
import {
	cloneTemplate,
	createTemplate,
	deleteTemplate,
	getTemplate,
	getTemplates,
	updateTemplate,
	uploadTemplateImage,
} from '@/services/templates';
import type {
	CloneTemplatePayload,
	CreateTemplatePayload,
	UpdateTemplatePayload,
} from '@/types/templates';

const QUERY_KEY = ['templates'] as const;
const DESIGNS_KEY = ['designs'] as const;

export function useTemplates(params?: TemplatesQueryParams) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'list', params] as const,
		queryFn: () => getTemplates(params),
	});
}

export function useTemplate(id: string | undefined) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'detail', id] as const,
		queryFn: () => getTemplate(id as string),
		enabled: !!id,
	});
}

export function useCreateTemplate() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateTemplatePayload) => createTemplate(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			toast.success('Template criado!');
		},
		onError: () => toast.error('Erro ao criar template'),
	});
}

export function useUpdateTemplate() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: UpdateTemplatePayload;
		}) => updateTemplate(id, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			toast.success('Template atualizado!');
		},
		onError: () => toast.error('Erro ao atualizar template'),
	});
}

export function useUploadTemplateImage() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, file }: { id: string; file: File }) =>
			uploadTemplateImage(id, file),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			toast.success('Imagem atualizada!');
		},
		onError: () => toast.error('Erro ao enviar imagem'),
	});
}

export function useDeleteTemplate() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteTemplate(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			toast.success('Template excluido!');
		},
		onError: () => toast.error('Erro ao excluir template'),
	});
}

export function useCloneTemplate() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload?: CloneTemplatePayload;
		}) => cloneTemplate(id, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: DESIGNS_KEY });
			toast.success('Design criado!');
		},
		onError: () => toast.error('Erro ao clonar template'),
	});
}
