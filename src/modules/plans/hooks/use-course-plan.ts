'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import {
	createCoursePlan,
	deleteCoursePlan,
	updateCoursePlan,
} from '../services/course-plan.service';
import type { UpsertCoursePlanPayload } from '../types/course-plan';
import { planDetailsQueryKey } from './use-plan-details';

interface CoursePlanArgs {
	slug: string;
	planKey: string;
	payload: UpsertCoursePlanPayload;
}

export function useCreateCoursePlan(planId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ slug, planKey, payload }: CoursePlanArgs) =>
			createCoursePlan(slug, planKey, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: planDetailsQueryKey(planId) });
			toast.success('Curso vinculado!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao vincular curso')),
	});
}

export function useUpdateCoursePlan(planId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ slug, planKey, payload }: CoursePlanArgs) =>
			updateCoursePlan(slug, planKey, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: planDetailsQueryKey(planId) });
			toast.success('Preços atualizados!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao atualizar preços')),
	});
}

export function useDeleteCoursePlan(planId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ slug, planKey }: { slug: string; planKey: string }) =>
			deleteCoursePlan(slug, planKey),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: planDetailsQueryKey(planId) });
			toast.success('Curso desvinculado!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao desvincular curso')),
	});
}
