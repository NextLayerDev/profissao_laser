'use client';

// Hooks TanStack Query da aba Mentoria. Convenção de keys:
// ['mentoria', <recurso>, ...ids] — invalidação por prefixo.
import {
	useMutation,
	useQueries,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';
import * as svc from './service';

const ROOT = ['mentoria'] as const;

export function useMentoriaBootstrap() {
	return useQuery({
		queryKey: [...ROOT, 'bootstrap'],
		queryFn: svc.getBootstrap,
		staleTime: 60_000,
	});
}

export function useUpsertCompany() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: svc.upsertCompany,
		onSuccess: () => qc.invalidateQueries({ queryKey: [...ROOT, 'bootstrap'] }),
	});
}

export function useJourneyMeetings(journeyId: string | undefined) {
	return useQuery({
		queryKey: [...ROOT, 'meetings', journeyId],
		queryFn: () => svc.listJourneyMeetings(journeyId as string),
		enabled: !!journeyId,
	});
}

export function useCompleteMeeting(journeyId: string | undefined) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: svc.completeMeeting,
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: [...ROOT, 'meetings', journeyId] });
			qc.invalidateQueries({ queryKey: [...ROOT, 'bootstrap'] });
		},
	});
}

// ── Diagnóstico ──────────────────────────────────────────────────────────────
export function useDiagnostic(journeyId: string | undefined) {
	return useQuery({
		queryKey: [...ROOT, 'diagnostic', journeyId],
		queryFn: () => svc.getDiagnostic(journeyId as string),
		enabled: !!journeyId,
	});
}

export function useSaveDiagnosticDraft(journeyId: string | undefined) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (answers: Record<string, unknown>) =>
			svc.saveDiagnosticDraft(journeyId as string, answers),
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: [...ROOT, 'diagnostic', journeyId] }),
	});
}

export function useSubmitDiagnostic(journeyId: string | undefined) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => svc.submitDiagnostic(journeyId as string),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: [...ROOT, 'diagnostic', journeyId] });
			qc.invalidateQueries({ queryKey: [...ROOT, 'bootstrap'] });
		},
	});
}

// ── Ferramentas ──────────────────────────────────────────────────────────────
export function useJourneyTools(journeyId: string | undefined) {
	return useQuery({
		queryKey: [...ROOT, 'tools', journeyId],
		queryFn: () => svc.listJourneyTools(journeyId as string),
		enabled: !!journeyId,
	});
}

export function useStartTool(journeyId: string | undefined) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (defId: string) => svc.startTool(journeyId as string, defId),
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: [...ROOT, 'tools', journeyId] }),
	});
}

export function useCompleteTool(journeyId: string | undefined) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			instanceId,
			completionPct,
		}: {
			instanceId: string;
			completionPct?: number;
		}) => svc.completeTool(instanceId, completionPct),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: [...ROOT, 'tools', journeyId] });
			qc.invalidateQueries({ queryKey: [...ROOT, 'company-map', journeyId] });
		},
	});
}

export function useCompanyMap(journeyId: string | undefined) {
	return useQuery({
		queryKey: [...ROOT, 'company-map', journeyId],
		queryFn: () => svc.getCompanyMap(journeyId as string),
		enabled: !!journeyId,
	});
}

// ── Tarefas ──────────────────────────────────────────────────────────────────
export function useTasks(
	journeyId: string | undefined,
	filter?: { status?: string; origin_type?: string },
) {
	return useQuery({
		queryKey: [...ROOT, 'tasks', journeyId, filter ?? {}],
		queryFn: () => svc.listTasks(journeyId as string, filter),
		enabled: !!journeyId,
	});
}

export function useTaskMutations(journeyId: string | undefined) {
	const qc = useQueryClient();
	const invalidate = () =>
		qc.invalidateQueries({ queryKey: [...ROOT, 'tasks', journeyId] });
	const create = useMutation({
		mutationFn: (body: Record<string, unknown> & { title: string }) =>
			svc.createTask(journeyId as string, body),
		onSuccess: invalidate,
	});
	const update = useMutation({
		mutationFn: ({
			taskId,
			body,
		}: {
			taskId: string;
			body: Record<string, unknown>;
		}) => svc.updateTask(taskId, body),
		onSuccess: invalidate,
	});
	const uploadEvidence = useMutation({
		mutationFn: ({ taskId, file }: { taskId: string; file: File }) =>
			svc.uploadTaskEvidence(taskId, file),
		onSuccess: invalidate,
	});
	const addLink = useMutation({
		mutationFn: ({ taskId, url }: { taskId: string; url: string }) =>
			svc.addTaskEvidenceLink(taskId, { kind: 'link', url }),
		onSuccess: invalidate,
	});
	return { create, update, uploadEvidence, addLink };
}

// ── KPIs ─────────────────────────────────────────────────────────────────────
export function useKpis(journeyId: string | undefined, category?: string) {
	return useQuery({
		queryKey: [...ROOT, 'kpis', journeyId, category ?? 'all'],
		queryFn: () => svc.listKpis(journeyId as string, category),
		enabled: !!journeyId,
	});
}

export function useKpiMutations(journeyId: string | undefined) {
	const qc = useQueryClient();
	const invalidate = () =>
		qc.invalidateQueries({ queryKey: [...ROOT, 'kpis', journeyId] });
	const create = useMutation({
		mutationFn: (body: Record<string, unknown> & { name: string }) =>
			svc.createKpi(journeyId as string, body),
		onSuccess: invalidate,
	});
	const addMeasurement = useMutation({
		mutationFn: ({
			kpiId,
			body,
		}: {
			kpiId: string;
			body: { value: number | null; measured_at: string; note?: string | null };
		}) => svc.addKpiMeasurement(kpiId, body),
		onSuccess: invalidate,
	});
	return { create, addMeasurement };
}

/**
 * Histórico de vários KPIs de uma vez — o gráfico de evolução do dashboard
 * precisa de N séries, e `useKpiHistory` num laço quebraria a regra dos hooks.
 * Reusa a MESMA queryKey de `useKpiHistory`, então o cache é compartilhado:
 * abrir a tela de um KPI depois do dashboard não refaz a chamada.
 */
export function useKpiHistories(kpiIds: string[]) {
	return useQueries({
		queries: kpiIds.map((kpiId) => ({
			queryKey: [...ROOT, 'kpi-history', kpiId],
			queryFn: () => svc.getKpiHistory(kpiId),
			staleTime: 60_000,
		})),
	});
}

export function useKpiHistory(kpiId: string | undefined) {
	return useQuery({
		queryKey: [...ROOT, 'kpi-history', kpiId],
		queryFn: () => svc.getKpiHistory(kpiId as string),
		enabled: !!kpiId,
	});
}

// ── Desenvolvimento pessoal ──────────────────────────────────────────────────
export function useGoodNews(journeyId: string | undefined) {
	return useQuery({
		queryKey: [...ROOT, 'good-news', journeyId],
		queryFn: () => svc.getGoodNews(journeyId as string),
		enabled: !!journeyId,
	});
}

export function usePostGoodNews(journeyId: string | undefined) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (news: string[]) => svc.postGoodNews(journeyId as string, news),
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: [...ROOT, 'good-news', journeyId] }),
	});
}

export function useGoals(journeyId: string | undefined) {
	return useQuery({
		queryKey: [...ROOT, 'goals', journeyId],
		queryFn: () => svc.listGoals(journeyId as string),
		enabled: !!journeyId,
	});
}

export function useGoalMutations(journeyId: string | undefined) {
	const qc = useQueryClient();
	const invalidate = () =>
		qc.invalidateQueries({ queryKey: [...ROOT, 'goals', journeyId] });
	const create = useMutation({
		mutationFn: (body: Record<string, unknown> & { title: string }) =>
			svc.createGoal(journeyId as string, body),
		onSuccess: invalidate,
	});
	const update = useMutation({
		mutationFn: ({
			goalId,
			body,
		}: {
			goalId: string;
			body: Record<string, unknown>;
		}) => svc.updateGoal(goalId, body),
		onSuccess: invalidate,
	});
	return { create, update };
}

export function useMaslowHistory(journeyId: string | undefined) {
	return useQuery({
		queryKey: [...ROOT, 'maslow', journeyId],
		queryFn: () => svc.getMaslowHistory(journeyId as string),
		enabled: !!journeyId,
	});
}

export function useSubmitMaslow(journeyId: string | undefined) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (answers: number[]) =>
			svc.submitMaslow(journeyId as string, answers),
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: [...ROOT, 'maslow', journeyId] }),
	});
}

export function useBusinessPlans(journeyId: string | undefined) {
	return useQuery({
		queryKey: [...ROOT, 'business-plans', journeyId],
		queryFn: () => svc.listBusinessPlans(journeyId as string),
		enabled: !!journeyId,
	});
}

// ── Materiais / Evolução ─────────────────────────────────────────────────────
export function useMyMaterials() {
	return useQuery({
		queryKey: [...ROOT, 'materials'],
		queryFn: svc.listMyMaterials,
	});
}

export function useSnapshots(journeyId: string | undefined) {
	return useQuery({
		queryKey: [...ROOT, 'snapshots', journeyId],
		queryFn: () => svc.listSnapshots(journeyId as string),
		enabled: !!journeyId,
	});
}

export function useComparison(
	journeyId: string | undefined,
	from: string,
	to: string,
) {
	return useQuery({
		queryKey: [...ROOT, 'compare', journeyId, from, to],
		queryFn: () => svc.compare(journeyId as string, from, to),
		enabled: !!journeyId,
	});
}

export function useReports(journeyId: string | undefined) {
	return useQuery({
		queryKey: [...ROOT, 'reports', journeyId],
		queryFn: () => svc.listReports(journeyId as string),
		enabled: !!journeyId,
	});
}

// ── Lives ────────────────────────────────────────────────────────────────────
export function useMyLives() {
	return useQuery({
		queryKey: [...ROOT, 'lives'],
		queryFn: svc.listMyLives,
		refetchInterval: 60_000,
	});
}

export function useLive(liveId: string | undefined) {
	return useQuery({
		queryKey: [...ROOT, 'live', liveId],
		queryFn: () => svc.getLive(liveId as string),
		enabled: !!liveId,
		refetchInterval: 30_000,
	});
}

export function useLivePlayback(liveId: string | undefined, enabled: boolean) {
	return useQuery({
		queryKey: [...ROOT, 'live-playback', liveId],
		queryFn: () => svc.getLivePlayback(liveId as string),
		enabled: !!liveId && enabled,
		// Renova antes do token de 1h expirar
		refetchInterval: 45 * 60_000,
	});
}

export function useLiveChat(liveId: string | undefined) {
	return useQuery({
		queryKey: [...ROOT, 'live-chat', liveId],
		queryFn: () => svc.listLiveChat(liveId as string),
		enabled: !!liveId,
		// Fallback de tempo real (Realtime do Supabase complementa no componente)
		refetchInterval: 5_000,
	});
}

export function usePostLiveChat(liveId: string | undefined) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (body: string) => svc.postLiveChat(liveId as string, body),
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: [...ROOT, 'live-chat', liveId] }),
	});
}

// ── Mentor ───────────────────────────────────────────────────────────────────
export function useMentorCohorts() {
	return useQuery({
		queryKey: [...ROOT, 'mentor-cohorts'],
		queryFn: svc.listMyCohorts,
	});
}

export function useCohortDashboard(cohortId: string | undefined) {
	return useQuery({
		queryKey: [...ROOT, 'cohort-dashboard', cohortId],
		queryFn: () => svc.getCohortDashboard(cohortId as string),
		enabled: !!cohortId,
	});
}

export function useJourneyOverview(journeyId: string | undefined) {
	return useQuery({
		queryKey: [...ROOT, 'journey-overview', journeyId],
		queryFn: () => svc.getJourneyOverview(journeyId as string),
		enabled: !!journeyId,
	});
}
