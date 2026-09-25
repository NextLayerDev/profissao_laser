'use client';

// Hooks TanStack Query locais das telas ADMIN + MENTOR da Mentoria 360°.
// Não tocamos em @/modules/mentoria/hooks — apenas consumimos o service.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useMe } from '@/modules/account';
import * as svc from '@/modules/mentoria/service';
import { listStudents } from '@/services/students';
import { getApiErrorMessage } from '@/shared/lib/api-error';

const ROOT = ['mentoria-admin'] as const;
// Prefixo do módulo (usado pelos hooks prontos useMentorCohorts etc.)
const MNT = ['mentoria'] as const;

// Códigos que os services mentoria-* da API lançam de fato (o mapa antigo
// tinha vários que ela nunca emite e deixava os reais chegarem crus).
const KNOWN: Record<string, string> = {
	journey_already_active: 'Este aluno já tem uma jornada ativa.',
	enroll_not_customer: 'Staff e admin não podem ser matriculados como aluno.',
	journey_not_found: 'Jornada não encontrada.',
	journey_not_active: 'A jornada deste aluno não está ativa.',
	user_not_found: 'Usuário não encontrado. Confira o ID informado.',
	cohort_not_found: 'Turma não encontrada.',
	cohort_not_open: 'A turma não está aberta para matrículas.',
	cohort_dates_invalid: 'A data de término precisa ser depois do início.',
	no_published_meeting_templates:
		'Não há encontros publicados. Publique os encontros antes de matricular.',
	mentor_must_be_staff:
		'Só usuários da equipe (staff/admin) podem ser mentores.',
	not_mentor_of_cohort: 'Você não é mentor da turma deste aluno.',
	tool_instance_not_found: 'O aluno ainda não abriu esta ferramenta.',
	mentor_not_in_cohort: 'Esta pessoa não é mentora desta turma.',
	forbidden: 'Você não tem permissão para esta ação.',
	meeting_not_found: 'Encontro não encontrado.',
	meeting_locked: 'Este encontro ainda está bloqueado.',
	meeting_not_done: 'O encontro ainda não foi concluído.',
	template_not_found: 'Modelo não encontrado.',
	template_version_conflict:
		'Outra pessoa salvou este modelo ao mesmo tempo. Recarregue e tente de novo.',
	form_template_not_found: 'Formulário não encontrado ou não publicado.',
	form_template_version_conflict:
		'Outra pessoa salvou este formulário ao mesmo tempo. Recarregue e tente de novo.',
	maturity_config_version_conflict:
		'Outra pessoa salvou a metodologia ao mesmo tempo. Recarregue e tente de novo.',
	live_not_found: 'Live não encontrada.',
	live_already_ended: 'Esta live já foi encerrada.',
	live_start_external_only: 'Só lives com link externo são iniciadas por aqui.',
	live_links_external_only: 'Links só valem para lives externas.',
	external_url_required: 'Informe o link da live externa.',
	stream_key_missing: 'Esta live ainda não tem chave de transmissão.',
	mux_not_configured:
		'Transmissão pela plataforma indisponível (Mux não configurado).',
	file_required: 'Selecione um arquivo.',
	material_not_found: 'Material não encontrado.',
	mentoria_access_invalid_students:
		'Algum dos selecionados não é aluno. Revise a lista.',
	foto_zero_missing: 'Este aluno ainda não enviou o diagnóstico.',
	raiox_final_exists:
		'Já existe Raio-X final calculado sobre esta Foto Zero; não dá para reabrir.',
	migration_pending:
		'Recurso ainda não disponível no banco (migration pendente). Avise o suporte técnico.',
	tool_definition_not_found: 'Ferramenta não encontrada.',
	task_not_found: 'Tarefa não encontrada.',
	report_not_found: 'Relatório não encontrado.',
	snapshot_not_found: 'Snapshot não encontrado.',
	task_not_done: 'Só dá para validar uma tarefa que o aluno concluiu.',
	material_url_locked:
		'O link de um material enviado como arquivo não pode ser trocado.',
	tool_definition_key_exists:
		'Já existe uma ferramenta com esse nome (key). Use outro nome.',
	tool_definition_protected:
		'Esta é uma ferramenta-base da metodologia e não pode ser excluída. Desative-a, se preciso.',
};

/** Mensagem pt-BR de um código da API (ex.: resultado do enroll-batch). */
export function mentoriaCodeMessage(
	code: string | null | undefined,
	fallback: string,
): string {
	return (code && KNOWN[code]) || fallback;
}

/** Traduz códigos de erro conhecidos da mentoria (409 etc.) p/ pt-BR. */
export function mentoriaErrorMessage(err: unknown, fallback: string): string {
	if (err instanceof AxiosError) {
		const body = err.response?.data as
			| { message?: string; code?: string; error?: string }
			| undefined;
		const raw = body?.message ?? body?.code ?? body?.error;
		if (raw && KNOWN[raw]) return KNOWN[raw];
		// Validação do Fastify vinha como 'body/name Too small: expected…'.
		if (body?.code === 'FST_ERR_VALIDATION') {
			return 'Dados inválidos. Revise o formulário.';
		}
		// 500 trazia 'internal_error' ou mensagem interna do banco, e código
		// snake_case desconhecido não diz nada ao admin: usa o texto da tela.
		if ((err.response?.status ?? 0) >= 500) return fallback;
		if (raw && /^[a-z0-9_]+$/.test(raw)) return fallback;
	}
	return getApiErrorMessage(err, fallback);
}

/**
 * O painel aceita qualquer token de equipe, mas Turmas, Encontros, Formulários,
 * Ferramentas, Acesso e Configurações são requireRole('admin') na API: o mentor
 * staff caía em 403 mostrado como "vazio". Enquanto /me não chega (ou falha),
 * assume admin para não esconder nada de quem pode.
 */
export function useIsMentoriaAdmin(): { isAdmin: boolean; ready: boolean } {
	const me = useMe();
	return {
		isAdmin: me.data ? me.data.role === 'admin' : true,
		ready: !me.isLoading,
	};
}

// ── Turmas ───────────────────────────────────────────────────────────────────
/** Admin: todas as turmas. Staff (mentor): só as dele — a rota admin dá 403 e
 * os selects de turma de Lives/Materiais ficavam vazios. */
export function useCohortsAdmin() {
	const { isAdmin, ready } = useIsMentoriaAdmin();
	const query = useQuery({
		queryKey: [...ROOT, 'cohorts', isAdmin ? 'all' : 'mine'],
		queryFn: isAdmin ? svc.listCohortsAdmin : svc.listMyCohorts,
		enabled: ready,
	});
	// Query desabilitada tem `isLoading` false: enquanto /me não chega, Turmas
	// mostrava "Nenhuma turma criada ainda." em vez do spinner.
	return ready ? query : { ...query, isLoading: true };
}

export function useCohortMentors(cohortId: string) {
	return useQuery({
		queryKey: [...ROOT, 'cohort-mentors', cohortId],
		queryFn: () => svc.listCohortMentors(cohortId),
	});
}

export function useCohortMutations() {
	const qc = useQueryClient();
	const invalidate = () => {
		qc.invalidateQueries({ queryKey: [...ROOT, 'cohorts'] });
		qc.invalidateQueries({ queryKey: [...ROOT, 'cohort-mentors'] });
		qc.invalidateQueries({ queryKey: [...MNT, 'mentor-cohorts'] });
		// Matricular tira o aluno da fila "Aguardando turma".
		qc.invalidateQueries({ queryKey: [...ROOT, 'waiting-students'] });
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
	const enrollBatch = useMutation({
		mutationFn: ({
			cohortId,
			userIds,
		}: {
			cohortId: string;
			userIds: string[];
		}) => svc.enrollStudentsBatch(cohortId, userIds),
		// onSettled: um 500 no meio do lote deixa os anteriores matriculados, e
		// a fila precisa refletir isso mesmo com o erro.
		onSettled: (_data, _err, vars) => {
			invalidate();
			qc.invalidateQueries({
				queryKey: [...MNT, 'cohort-dashboard', vars.cohortId],
			});
		},
	});
	return { create, update, addMentor, removeMentor, enroll, enrollBatch };
}

/** Fila "Aguardando turma": só admin (a rota é requireRole('admin')). */
export function useWaitingStudents() {
	const { isAdmin, ready } = useIsMentoriaAdmin();
	return useQuery({
		queryKey: [...ROOT, 'waiting-students'],
		queryFn: svc.listWaitingStudents,
		enabled: ready && isAdmin,
	});
}

/** Busca de alunos p/ matrícula (endpoint admin de students do upvox). */
export function useStudentSearch(q: string) {
	const term = q.trim();
	// Espera a pessoa parar de digitar: sem isso cada tecla virava uma request
	// e a resposta de "fasnuc" podia chegar depois da de "fasnucci".
	const debounced = useDebouncedValue(term, 300);
	const query = useQuery({
		queryKey: [...ROOT, 'student-search', debounced],
		queryFn: () => listStudents({ q: debounced, limit: 8 }),
		enabled: debounced.length >= 2,
		staleTime: 30_000,
	});
	// Enquanto o debounce não assentou, mostra "Buscando..." em vez de piscar
	// "Nenhum aluno encontrado" com o resultado da busca anterior.
	const settling = term.length >= 2 && term !== debounced;
	return { ...query, isLoading: query.isLoading || settling };
}

/**
 * Erro da busca de alunos em pt-BR. Antes qualquer falha (inclusive 403 de
 * quem não é admin/staff) aparecia como "Nenhum aluno encontrado".
 */
export function studentSearchErrorMessage(
	err: unknown,
	action = 'buscar alunos',
): string {
	const status = err instanceof AxiosError ? err.response?.status : undefined;
	if (status === 403)
		return `Sua conta não tem permissão de admin/staff para ${action}.`;
	if (status === 401) return 'Sessão expirada. Entre novamente.';
	return 'Não foi possível buscar agora. Tente de novo.';
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

/**
 * Selo do mentor por ferramenta. Com uma validada, o Mapa e o score contam
 * só as validadas: recarrega o Mapa e o overview (maturity_score).
 */
export function useMentorToolValidation(journeyId: string | undefined) {
	const qc = useQueryClient();
	const invalidate = () => {
		qc.invalidateQueries({ queryKey: [...ROOT, 'company-map', journeyId] });
		qc.invalidateQueries({
			queryKey: [...MNT, 'journey-overview', journeyId],
		});
	};
	const validate = useMutation({
		mutationFn: svc.validateToolInstance,
		onSuccess: invalidate,
	});
	const unvalidate = useMutation({
		mutationFn: svc.unvalidateToolInstance,
		onSuccess: invalidate,
	});
	return { validate, unvalidate };
}

export function useMentorSubmissions(journeyId: string | undefined) {
	return useQuery({
		queryKey: [...ROOT, 'submissions', journeyId],
		queryFn: () => svc.listSubmissionsAsMentor(journeyId as string),
		enabled: !!journeyId,
	});
}

export function useMentorDiagnostic(journeyId: string | undefined) {
	return useQuery({
		queryKey: [...ROOT, 'diagnostic', journeyId],
		queryFn: () => svc.getDiagnosticAsMentor(journeyId as string),
		enabled: !!journeyId,
	});
}

export function useReopenDiagnostic(journeyId: string | undefined) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (reason: string | null) =>
			svc.reopenDiagnostic(journeyId as string, reason),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: [...ROOT, 'diagnostic', journeyId] });
			qc.invalidateQueries({ queryKey: [...ROOT, 'submissions', journeyId] });
			qc.invalidateQueries({
				queryKey: [...ROOT, 'diagnostic-reopens', journeyId],
			});
			qc.invalidateQueries({ queryKey: [...MNT] });
		},
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
			feedback: string | null;
		}) => svc.setMeetingFeedback(meetingId, fb),
		onSuccess: invalidate,
	});
	return { validate, feedback };
}

export function useMentorCommentTask(journeyId: string | undefined) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			taskId,
			comment,
		}: {
			taskId: string;
			comment: string | null;
		}) => svc.commentTaskAsMentor(taskId, comment),
		onSuccess: (_task, { taskId }) => {
			qc.invalidateQueries({ queryKey: [...ROOT, 'journey-tasks', journeyId] });
			qc.invalidateQueries({ queryKey: [...ROOT, 'task-comments', taskId] });
		},
	});
}

/** Histórico dos comentários: só busca quando o mentor abre. */
export function useMentorTaskComments(taskId: string, enabled: boolean) {
	return useQuery({
		queryKey: [...ROOT, 'task-comments', taskId],
		queryFn: () => svc.listTaskCommentsAsMentor(taskId),
		enabled,
	});
}

// ── Visão 360° (só leitura; cada aba só busca quando está aberta) ──────────
function mentorRead<T>(
	key: string,
	journeyId: string | undefined,
	fn: (journeyId: string) => Promise<T>,
) {
	return {
		queryKey: [...ROOT, key, journeyId],
		queryFn: () => fn(journeyId as string),
		enabled: !!journeyId,
	};
}

export function useMentorDiagnosticReopens(journeyId: string | undefined) {
	return useQuery(
		mentorRead(
			'diagnostic-reopens',
			journeyId,
			svc.listDiagnosticReopensAsMentor,
		),
	);
}

export function useMentorToolContent(journeyId: string | undefined) {
	return useQuery(
		mentorRead('tool-content', journeyId, svc.getToolContentAsMentor),
	);
}

export function useMentorGoodNews(journeyId: string | undefined) {
	return useQuery(mentorRead('good-news', journeyId, svc.getGoodNewsAsMentor));
}

export function useMentorGoals(journeyId: string | undefined) {
	return useQuery(mentorRead('goals', journeyId, svc.listGoalsAsMentor));
}

export function useMentorMaslow(journeyId: string | undefined) {
	return useQuery(
		mentorRead('maslow', journeyId, svc.getMaslowHistoryAsMentor),
	);
}

export function useMentorBusinessPlans(journeyId: string | undefined) {
	return useQuery(
		mentorRead('business-plans', journeyId, svc.listBusinessPlansAsMentor),
	);
}

export function useMentorSnapshots(journeyId: string | undefined) {
	return useQuery(
		mentorRead('snapshots', journeyId, svc.listSnapshotsAsMentor),
	);
}

export function useMentorReports(journeyId: string | undefined) {
	return useQuery(mentorRead('reports', journeyId, svc.listReportsAsMentor));
}

export function useMentorComparison(
	journeyId: string | undefined,
	from: string,
	to: string,
	enabled: boolean,
) {
	return useQuery({
		queryKey: [...ROOT, 'compare', journeyId, from, to],
		queryFn: () => svc.compareAsMentor(journeyId as string, from, to),
		enabled: !!journeyId && enabled,
	});
}

/** Template do Plano de Negócios (rótulos das versões). */
export function useBusinessPlanTemplate(enabled: boolean) {
	return useQuery({
		queryKey: [...ROOT, 'form-template', 'plano_negocios'],
		queryFn: () => svc.getFormTemplate('plano_negocios'),
		enabled,
		retry: false,
	});
}

/** Admin: encerrar/reativar. Recarrega a visão e as listas da turma. */
export function useSetJourneyStatus(journeyId: string | undefined) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (status: 'active' | 'completed') =>
			svc.setJourneyStatus(journeyId as string, status),
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: [...MNT, 'journey-overview', journeyId],
			});
			qc.invalidateQueries({ queryKey: [...MNT] });
			qc.invalidateQueries({ queryKey: [...ROOT] });
		},
	});
}

export function useMentorValidateTask(journeyId: string | undefined) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (taskId: string) => svc.validateTaskAsMentor(taskId),
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
		onSuccess: () => {
			invalidate();
			// Publicar mexe nas jornadas em andamento (visão do mentor/aluno).
			qc.invalidateQueries({ queryKey: MNT });
		},
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

export function usePatchToolDefinition() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			body,
		}: {
			id: string;
			body: Parameters<typeof svc.patchToolDefinition>[1];
		}) => svc.patchToolDefinition(id, body),
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: [...ROOT, 'tool-definitions'] }),
	});
}

export function useDeleteToolDefinition() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, force }: { id: string; force?: boolean }) =>
			svc.deleteToolDefinition(id, force),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: [...ROOT, 'tool-definitions'] });
			qc.invalidateQueries({ queryKey: [...MNT] });
		},
	});
}

/** Nº de alunos que já iniciaram a ferramenta, quando o 409 é "em uso". */
export function toolInUseCount(err: unknown): number | null {
	if (!(err instanceof AxiosError)) return null;
	const body = err.response?.data as
		| { message?: string; details?: { instances?: number } }
		| undefined;
	return body?.message === 'tool_definition_in_use'
		? (body.details?.instances ?? 0)
		: null;
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
	const start = useMutation({
		mutationFn: svc.startLive,
		onSuccess: invalidate,
	});
	// Objeto e não dois argumentos: `useMutation` só passa o primeiro adiante.
	const end = useMutation({
		mutationFn: (v: { id: string; recordingUrl?: string | null }) =>
			svc.endLive(v.id, v.recordingUrl),
		onSuccess: invalidate,
	});
	const update = useMutation({
		mutationFn: (v: { id: string; body: Record<string, unknown> }) =>
			svc.updateLive(v.id, v.body),
		onSuccess: invalidate,
	});
	return { create, start, end, update };
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

// ── Liberação restrita ───────────────────────────────────────────────────────
export function useMentoriaAccessAdmin() {
	return useQuery({
		queryKey: [...ROOT, 'access'],
		queryFn: svc.getMentoriaAccessAdmin,
	});
}

export function useSetToolsLock() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: svc.setToolsLock,
		onSuccess: (data) => {
			qc.setQueryData([...ROOT, 'access'], data);
			qc.invalidateQueries({ queryKey: MNT });
		},
	});
}

export function useUpdateMentoriaAccess() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: svc.updateMentoriaAccess,
		onSuccess: (data) => {
			qc.setQueryData([...ROOT, 'access'], data);
			qc.invalidateQueries({ queryKey: MNT });
		},
	});
}
