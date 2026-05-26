'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { updateTool } from '../services/tools.service';
import type { UpdateToolPayload } from '../types/tools';
import { toolsQueryKey } from './use-tools';

/**
 * Atualiza uma tool globalmente. Afeta todos os planos que usam essa tool.
 * Por isso o `onSuccess` recebe o callback `extraInvalidate` opcional,
 * usado por telas que mantêm um agregado (ex: planDetails) que precisa
 * recarregar pra refletir o novo `vox_cost`.
 */
export function useUpdateTool(extraInvalidate?: () => void) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: UpdateToolPayload }) =>
			updateTool(id, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: toolsQueryKey });
			extraInvalidate?.();
			toast.success('Tool atualizada!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao atualizar tool')),
	});
}
