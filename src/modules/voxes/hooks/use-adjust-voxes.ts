'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { adjustVoxes } from '../services/voxes.service';
import type { AdjustVoxesPayload } from '../types/voxes';

export function useAdjustVoxes() {
	return useMutation({
		mutationFn: (payload: AdjustVoxesPayload) => adjustVoxes(payload),
		onSuccess: ({ balance }) =>
			toast.success(`Saldo ajustado. Novo saldo: ${balance}`),
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao ajustar saldo')),
	});
}
