'use client';

import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCourses } from '@/modules/courses';
import {
	type ChangePlanMode,
	cancelStudentSubscription,
	changeStudentPlan,
	deleteStudent,
	type ListStudentsParams,
	listStudents,
	setStudentBlocked,
	setStudentPassword,
	setStudentTestUnlimited,
} from '@/services/students';
import { getApiErrorMessage } from '@/shared/lib/api-error';

export const studentsQueryKey = ['students'] as const;

/** Lista paginada/filtrada de alunos (server-side). */
export function useStudents(params: ListStudentsParams) {
	return useQuery({
		queryKey: [...studentsQueryKey, params],
		queryFn: () => listStudents(params),
		placeholderData: keepPreviousData,
	});
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
	qc.invalidateQueries({ queryKey: studentsQueryKey });
}

export function useChangeStudentPlan() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			planId,
			mode,
		}: {
			id: string;
			planId: string;
			mode: ChangePlanMode;
		}) => changeStudentPlan(id, planId, mode),
		onSuccess: () => {
			invalidate(qc);
			toast.success('Plano alterado.');
		},
		// 409 (sem assinatura Stripe ativa para o modo "stripe") é tratado no modal.
	});
}

export function useCancelStudentSubscription() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => cancelStudentSubscription(id),
		onSuccess: () => {
			invalidate(qc);
			toast.success('Assinatura cancelada.');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao cancelar assinatura')),
	});
}

export function useSetStudentTestUnlimited() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			isTestUnlimited,
		}: {
			id: string;
			isTestUnlimited: boolean;
		}) => setStudentTestUnlimited(id, isTestUnlimited),
		onSuccess: (_data, { isTestUnlimited }) => {
			invalidate(qc);
			toast.success(
				isTestUnlimited
					? 'Conta marcada como teste ilimitada.'
					: 'Conta teste removida.',
			);
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao atualizar conta teste')),
	});
}

export function useSetStudentBlocked() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, blocked }: { id: string; blocked: boolean }) =>
			setStudentBlocked(id, blocked),
		onSuccess: () => invalidate(qc),
	});
}

export function useSetStudentPassword() {
	return useMutation({
		mutationFn: ({ id, password }: { id: string; password: string }) =>
			setStudentPassword(id, password),
	});
}

export function useDeleteStudent() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteStudent(id),
		onSuccess: () => invalidate(qc),
	});
}

/* ------------------------------------------------------------------ */
/*  Plans for the change-plan picker (real upvox plans, by course)     */
/* ------------------------------------------------------------------ */

export interface PlanOption {
	id: string;
	key: string;
	name: string;
}

export interface CoursePlanGroup {
	courseId: string;
	courseTitle: string;
	plans: PlanOption[];
}

/**
 * Real upvox plans for the change-plan picker, grouped by course.
 *
 * Source: `GET /v1/courses` (the catalog already used elsewhere), which embeds
 * `plans[].plan {id,key,name}` per course. Also returns a de-duplicated flat
 * list for the filter `<select>`.
 */
export function usePlanOptions() {
	const { data: courses, isLoading, error } = useCourses();

	const groups: CoursePlanGroup[] = (courses ?? [])
		.map((c) => ({
			courseId: c.id,
			courseTitle: c.title,
			plans: c.plans.map(({ plan }) => ({
				id: plan.id,
				key: plan.key,
				name: plan.name,
			})),
		}))
		.filter((g) => g.plans.length > 0);

	const flat: PlanOption[] = [];
	const seen = new Set<string>();
	for (const g of groups) {
		for (const p of g.plans) {
			if (seen.has(p.id)) continue;
			seen.add(p.id);
			flat.push(p);
		}
	}

	return { groups, flat, isLoading, error };
}
