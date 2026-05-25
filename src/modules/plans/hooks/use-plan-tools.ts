'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { removePlanTool, setPlanTool } from '../services/plan-tools.service';
import type { SetPlanToolPayload } from '../types/plan-tools';
import { planDetailsQueryKey } from './use-plan-details';

export function useSetPlanTool(planId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			toolKey,
			payload,
		}: {
			toolKey: string;
			payload: SetPlanToolPayload;
		}) => setPlanTool(planId, toolKey, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: planDetailsQueryKey(planId) });
			toast.success('Entitlement salvo!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao salvar entitlement')),
	});
}

export function useRemovePlanTool(planId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (toolKey: string) => removePlanTool(planId, toolKey),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: planDetailsQueryKey(planId) });
			toast.success('Tool removida do plano');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao remover tool')),
	});
}
