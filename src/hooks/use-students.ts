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
	getStudent,
	getStudentActivity,
	grantStudentVoxes,
	type ListStudentsParams,
	listStudents,
	type StudentActivityParams,
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

/**
 * Detalhe de um aluno (`StudentDetail`, com a assinatura embutida).
 *
 * A chave fica sob `['students', 'detail', id]`, então as mutations acima
 * (que invalidam `['students']`) já atualizam esta query automaticamente.
 */
export function useStudent(id: string) {
	return useQuery({
		queryKey: [...studentsQueryKey, 'detail', id],
		queryFn: () => getStudent(id),
		enabled: !!id,
	});
}

/**
 * Atividade do aluno (uso de ferramentas + histórico de voxxys), paginados de
 * forma independente. A chave inclui os `params` para que cada combinação de
 * página seja cacheada; `keepPreviousData` evita flicker ao paginar.
 */
export function useStudentActivity(id: string, params: StudentActivityParams) {
	return useQuery({
		queryKey: [...studentsQueryKey, 'activity', id, params],
		queryFn: () => getStudentActivity(id, params),
		enabled: !!id,
		placeholderData: keepPreviousData,
	});
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
	qc.invalidateQueries({ queryKey: studentsQueryKey });
}

export function useGrantStudentVoxes() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			delta,
			note,
		}: {
			id: string;
			delta: number;
			note?: string;
		}) => grantStudentVoxes(id, delta, note),
		onSuccess: (_data, { delta }) => {
			invalidate(qc);
			toast.success(
				delta > 0
					? `Adicionados ${delta.toLocaleString('pt-BR')} voxxys.`
					: `Removidos ${Math.abs(delta).toLocaleString('pt-BR')} voxxys.`,
			);
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao ajustar voxxys')),
	});
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
