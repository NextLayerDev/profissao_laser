'use client';

// Hooks TanStack Query locais das telas ADMIN + MENTOR da Mentoria 360°.
// Não tocamos em @/modules/mentoria/hooks — apenas consumimos o service.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import * as svc from '@/modules/mentoria/service';
import { listStudents } from '@/services/students';
import { getApiErrorMessage } from '@/shared/lib/api-error';

const ROOT = ['mentoria-admin'] as const;
// Prefixo do módulo (usado pelos hooks prontos useMentorCohorts etc.)
const MNT = ['mentoria'] as const;

/** Traduz códigos de erro conhecidos da mentoria (409 etc.) p/ pt-BR. */
export function mentoriaErrorMessage(err: unknown, fallback: string): string {
	const KNOWN: Record<string, string> = {
		journey_already_active: 'Este aluno já tem uma jornada ativa.',
		already_enrolled: 'Este aluno já está matriculado nesta turma.',
		user_not_found: 'Usuário não encontrado. Confira o ID informado.',
		cohort_not_found: 'Turma não encontrada.',
		company_required: 'Informe o nome da empresa do aluno.',
		mentor_already_added: 'Este mentor já está na turma.',
		template_not_published: 'O template precisa estar publicado.',
		form_template_in_use:
			'Este formulário está em uso e não pode ser alterado.',
		live_not_active: 'A live não está ativa.',
	};
	if (err instanceof AxiosError) {
		const body = err.response?.data as
			| { message?: string; code?: string; error?: string }
			| undefined;
		const raw = body?.message ?? body?.code ?? body?.error;
		if (raw && KNOWN[raw]) return KNOWN[raw];
	}
	return getApiErrorMessage(err, fallback);
}

// ── Turmas ───────────────────────────────────────────────────────────────────
export function useCohortsAdmin() {
	return useQuery({
		queryKey: [...ROOT, 'cohorts'],
		queryFn: svc.listCohortsAdmin,
	});
}

export function useCohortMutations() {
	const qc = useQueryClient();
	const invalidate = () => {
		qc.invalidateQueries({ queryKey: [...ROOT, 'cohorts'] });
		qc.invalidateQueries({ queryKey: [...MNT, 'mentor-cohorts'] });
	};
	const create = useMutation({
		mutationFn: svc.createCohort,
		onSuccess: invalidate,
	});
	const update = useMutation({
		mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
			svc.updateCohort(id, body),
		onSuccess: invalidate,
	});
	const addMentor = useMutation({
		mutationFn: ({
			cohortId,
			body,
		}: {
			cohortId: string;
			body: { mentor_user_id: string; role?: 'lead' | 'assistant' };
		}) => svc.addCohortMentor(cohortId, body),
		onSuccess: invalidate,
	});
	const removeMentor = useMutation({
		mutationFn: ({
			cohortId,
			mentorUserId,
		}: {
			cohortId: string;
			mentorUserId: string;
		}) => svc.removeCohortMentor(cohortId, mentorUserId),
		onSuccess: invalidate,
	});
	const enroll = useMutation({
		mutationFn: ({
			cohortId,
			body,
		}: {
			cohortId: string;
			body: { user_id: string; company_name?: string };
		}) => svc.enrollStudent(cohortId, body),
		onSuccess: (_data, vars) => {
			invalidate();
			qc.invalidateQueries({
				queryKey: [...MNT, 'cohort-dashboard', vars.cohortId],
			});
		},
	});
	return { create, update, addMentor, removeMentor, enroll };
}

/** Busca de alunos p/ matrícula (endpoint admin de students do upvox). */
export function useStudentSearch(q: string) {
	return useQuery({
		queryKey: [...ROOT, 'student-search', q],
		queryFn: () => listStudents({ q, limit: 8 }),
		enabled: q.trim().length >= 2,
		staleTime: 30_000,
	});
}

// ── Jornada (visão do mentor) ────────────────────────────────────────────────
export function useMentorJourneyTasks(journeyId: string | undefined) {
	return useQuery({
		queryKey: [...ROOT, 'journey-tasks', journeyId],
		queryFn: () => svc.listJourneyTasksAsMentor(journeyId as string),
		enabled: !!journeyId,
	});
}

export function useMentorJourneyKpis(journeyId: string | undefined) {
	return useQuery({
		queryKey: [...ROOT, 'journey-kpis', journeyId],
		queryFn: () => svc.listJourneyKpisAsMentor(journeyId as string),
		enabled: !!journeyId,
	});
}

export function useMentorCompanyMap(journeyId: string | undefined) {
	return useQuery({
		queryKey: [...ROOT, 'company-map', journeyId],
		queryFn: () => svc.getCompanyMapAsMentor(journeyId as string),
		enabled: !!journeyId,
	});
}

export function useMentorSubmissions(journeyId: string | undefined) {
	return useQuery({
		queryKey: [...ROOT, 'submissions', journeyId],
		queryFn: () => svc.listSubmissionsAsMentor(journeyId as string),
		enabled: !!journeyId,
	});
}

export function useMentorMeetingMutations(journeyId: string | undefined) {
	const qc = useQueryClient();
	const invalidate = () =>
		qc.invalidateQueries({
			queryKey: [...MNT, 'journey-overview', journeyId],
		});
	const validate = useMutation({
		mutationFn: svc.validateMeeting,
		onSuccess: invalidate,
	});
	const feedback = useMutation({
		mutationFn: ({
			meetingId,
			feedback: fb,
		}: {
			meetingId: string;
			feedback: string;
		}) => svc.setMeetingFeedback(meetingId, fb),
		onSuccess: invalidate,
	});
	return { validate, feedback };
}

export function useMentorCommentTask(journeyId: string | undefined) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ taskId, comment }: { taskId: string; comment: string }) =>
			svc.commentTaskAsMentor(taskId, comment),
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: [...ROOT, 'journey-tasks', journeyId] }),
	});
}

// ── Templates de encontro ────────────────────────────────────────────────────
export function useMeetingTemplatesAdmin() {
	return useQuery({
		queryKey: [...ROOT, 'meeting-templates'],
		queryFn: svc.listMeetingTemplatesAdmin,
	});
}

export function useMeetingTemplateMutations() {
	const qc = useQueryClient();
	const invalidate = () =>
		qc.invalidateQueries({ queryKey: [...ROOT, 'meeting-templates'] });
	const create = useMutation({
		mutationFn: svc.createMeetingTemplate,
		onSuccess: invalidate,
	});
	const publish = useMutation({
		mutationFn: svc.publishMeetingTemplate,
		onSuccess: invalidate,
	});
	return { create, publish };
}

// ── Templates de formulário ──────────────────────────────────────────────────
export function useFormTemplatesAdmin() {
	return useQuery({
		queryKey: [...ROOT, 'form-templates'],
		queryFn: svc.listFormTemplatesAdmin,
	});
}

export function useFormTemplateMutations() {
	const qc = useQueryClient();
	const invalidate = () =>
		qc.invalidateQueries({ queryKey: [...ROOT, 'form-templates'] });
	const create = useMutation({
		mutationFn: svc.createFormTemplate,
		onSuccess: invalidate,
	});
	const publish = useMutation({
		mutationFn: svc.publishFormTemplate,
		onSuccess: invalidate,
	});
	return { create, publish };
}

// ── Ferramentas ──────────────────────────────────────────────────────────────
export function useToolDefinitionsAdmin() {
	return useQuery({
		queryKey: [...ROOT, 'tool-definitions'],
		queryFn: svc.listToolDefinitionsAdmin,
	});
}

export function useUpsertToolDefinition() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: svc.upsertToolDefinition,
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: [...ROOT, 'tool-definitions'] }),
	});
}

// ── Materiais ────────────────────────────────────────────────────────────────
export function useMaterialsAdmin() {
	return useQuery({
		queryKey: [...ROOT, 'materials'],
		queryFn: svc.listMaterialsAdmin,
	});
}

export function useMaterialMutations() {
	const qc = useQueryClient();
	const invalidate = () =>
		qc.invalidateQueries({ queryKey: [...ROOT, 'materials'] });
	const createLink = useMutation({
		mutationFn: svc.createMaterialLink,
		onSuccess: invalidate,
	});
	const upload = useMutation({
		mutationFn: ({
			file,
			params,
		}: {
			file: File;
			params: { title: string; cohort_id?: string };
		}) => svc.uploadMaterial(file, params),
		onSuccess: invalidate,
	});
	const remove = useMutation({
		mutationFn: svc.deleteMaterial,
		onSuccess: invalidate,
	});
	return { createLink, upload, remove };
}

// ── Lives ────────────────────────────────────────────────────────────────────
export function useLivesAdmin() {
	return useQuery({
		queryKey: [...ROOT, 'lives'],
		queryFn: svc.listLivesAdmin,
		refetchInterval: 60_000,
	});
}

export function useLiveMutations() {
	const qc = useQueryClient();
	const invalidate = () =>
		qc.invalidateQueries({ queryKey: [...ROOT, 'lives'] });
	const create = useMutation({
		mutationFn: svc.createLive,
		onSuccess: invalidate,
	});
	const end = useMutation({ mutationFn: svc.endLive, onSuccess: invalidate });
	return { create, end };
}

export function useLiveCredentials(
	liveId: string | undefined,
	enabled: boolean,
) {
	return useQuery({
		queryKey: [...ROOT, 'live-credentials', liveId],
		queryFn: () => svc.getLiveCredentials(liveId as string),
		enabled: !!liveId && enabled,
		staleTime: Number.POSITIVE_INFINITY,
	});
}

// ── Configurações (maturidade) ───────────────────────────────────────────────
export function useMaturityConfigs() {
	return useQuery({
		queryKey: [...ROOT, 'maturity-configs'],
		queryFn: svc.listMaturityConfigs,
	});
}

export function useCreateMaturityConfig() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: svc.createMaturityConfig,
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: [...ROOT, 'maturity-configs'] }),
	});
}
