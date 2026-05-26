'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import {
	createPlan,
	deletePlan,
	listPlans,
	updatePlan,
} from '../services/plans.service';
import type { CreatePlanPayload, UpdatePlanPayload } from '../types/plans';

export const plansQueryKey = ['plans'] as const;

export function usePlans() {
	return useQuery({ queryKey: plansQueryKey, queryFn: listPlans });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
	qc.invalidateQueries({ queryKey: plansQueryKey });
}

export function useCreatePlan() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreatePlanPayload) => createPlan(payload),
		onSuccess: () => {
			invalidate(qc);
			toast.success('Plano criado!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao criar plano')),
	});
}

export function useUpdatePlan() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: UpdatePlanPayload }) =>
			updatePlan(id, payload),
		onSuccess: () => {
			invalidate(qc);
			toast.success('Plano atualizado!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao atualizar plano')),
	});
}

export function useDeletePlan() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deletePlan(id),
		onSuccess: () => {
			invalidate(qc);
			toast.success('Plano removido!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao remover plano')),
	});
}
