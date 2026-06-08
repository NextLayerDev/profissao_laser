'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { createTool, deleteTool } from '../services/tools.service';
import type { CreateToolPayload } from '../types/tools';
import { toolsQueryKey } from './use-tools';

export function useCreateTool() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateToolPayload) => createTool(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: toolsQueryKey });
			toast.success('Tool criada!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao criar tool')),
	});
}

export function useDeleteTool() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteTool(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: toolsQueryKey });
			toast.success('Tool removida!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao remover tool')),
	});
}
