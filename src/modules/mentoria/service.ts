// Chamadas HTTP da aba Mentoria — TODAS na upvox-api (/v1) via apiCourses.
import { apiCourses as api } from '@/shared/lib/api-courses';
import type {
	AssistantMessage,
	AssistantReply,
	AssistantUsage,
	CohortDashboardRow,
	CompanyMap,
	Comparison,
	DiagnosticReopen,
	DiagnosticState,
	EnrollBatchResult,
	GoodNewsState,
	LiveCredentials,
	LivePlayback,
	MeetingTemplatePublishImpact,
	MentoriaAccessAdmin,
	MentoriaBootstrap,
	MentoriaWaitingStudent,
	MentorToolContent,
	MntBusinessPlanVersion,
	MntCohort,
	MntCohortMentor,
	MntCompany,
	MntFinancialEntry,
	MntFormSubmission,
	MntFormTemplate,
	MntFunnelStage,
	MntGoal,
	MntGoodNews,
	MntImprovementCycle,
	MntJourney,
	MntJourneyMeeting,
	MntKpi,
	MntKpiMeasurement,
	MntLiveChatMessage,
	MntLiveRoom,
	MntMaslowTest,
	MntMaterial,
	MntMaturityConfig,
	MntMeetingTemplate,
	MntOrgPosition,
	MntPop,
	MntProcessFlow,
	MntProcessStep,
	MntReport,
	MntSnapshot,
	MntTask,
	MntTaskComment,
	MntToolDefinition,
	MntToolInstance,
	MyMentoriaAccess,
	ToolWithInstance,
	UnpublishedMeetingTemplate,
	UploadMaterialParams,
} from './types';

// ── Mentorado: núcleo ────────────────────────────────────────────────────────
/** Pode ver a Mentoria? Responde false em vez de 403 (usado pelo menu). */
export async function getMyMentoriaAccess(): Promise<MyMentoriaAccess> {
	const { data } = await api.get('/v1/me/mentoria/access');
	return data;
}

export async function getBootstrap(): Promise<MentoriaBootstrap> {
	const { data } = await api.get('/v1/me/mentoria');
	return data;
}

export async function upsertCompany(
	body: Partial<MntCompany> & { name: string },
): Promise<MntCompany> {
	const { data } = await api.post('/v1/me/mentoria/company', body);
	return data;
}

export async function listMyJourneys(): Promise<MntJourney[]> {
	const { data } = await api.get('/v1/me/mentoria/journeys');
	return data;
}

export async function listJourneyMeetings(
	journeyId: string,
): Promise<MntJourneyMeeting[]> {
	const { data } = await api.get(
		`/v1/me/mentoria/journey/${journeyId}/meetings`,
	);
	return data;
}

export async function completeMeeting(
	meetingId: string,
): Promise<MntJourneyMeeting> {
	const { data } = await api.post(
		`/v1/me/mentoria/meeting/${meetingId}/complete`,
	);
	return data;
}

// ── Diagnóstico / Formulários ────────────────────────────────────────────────
export async function getDiagnostic(
	journeyId: string,
): Promise<DiagnosticState> {
	const { data } = await api.get(
		`/v1/me/mentoria/journey/${journeyId}/diagnostic`,
	);
	return data;
}

export async function saveDiagnosticDraft(
	journeyId: string,
	answers: Record<string, unknown>,
): Promise<MntFormSubmission> {
	const { data } = await api.put(
		`/v1/me/mentoria/journey/${journeyId}/diagnostic/draft`,
		{ answers },
	);
	return data;
}

export async function submitDiagnostic(
	journeyId: string,
): Promise<DiagnosticState> {
	const { data } = await api.post(
		`/v1/me/mentoria/journey/${journeyId}/diagnostic/submit`,
	);
	return data;
}

export async function getFormTemplate(key: string): Promise<MntFormTemplate> {
	const { data } = await api.get(`/v1/mentoria/form-template/${key}`);
	return data;
}

/** Template publicado por id (exercício do encontro / avaliação final). */
export async function getFormTemplateById(
	id: string,
): Promise<MntFormTemplate> {
	const { data } = await api.get(`/v1/mentoria/form-template/id/${id}`);
	return data;
}

export async function listSubmissions(
	journeyId: string,
	params?: { context?: string; context_ref_id?: string },
): Promise<MntFormSubmission[]> {
	const { data } = await api.get(
		`/v1/me/mentoria/journey/${journeyId}/form-submissions`,
		{ params },
	);
	return data;
}

export async function saveSubmissionDraft(
	journeyId: string,
	body: {
		form_template_id: string;
		context: string;
		context_ref_id?: string | null;
		answers: Record<string, unknown>;
	},
): Promise<MntFormSubmission> {
	const { data } = await api.put(
		`/v1/me/mentoria/journey/${journeyId}/form-submissions/draft`,
		body,
	);
	return data;
}

export async function submitSubmission(
	journeyId: string,
	submissionId: string,
): Promise<MntFormSubmission> {
	const { data } = await api.post(
		`/v1/me/mentoria/journey/${journeyId}/form-submission/${submissionId}/submit`,
	);
	return data;
}

// ── Ferramentas ──────────────────────────────────────────────────────────────
export async function listJourneyTools(
	journeyId: string,
): Promise<ToolWithInstance[]> {
	const { data } = await api.get(`/v1/me/mentoria/journey/${journeyId}/tools`);
	return data;
}

export async function startTool(
	journeyId: string,
	defId: string,
): Promise<MntToolInstance> {
	const { data } = await api.post(
		`/v1/me/mentoria/journey/${journeyId}/tool/${defId}/start`,
	);
	return data;
}

export async function completeTool(
	instanceId: string,
	completionPct?: number,
): Promise<MntToolInstance> {
	const { data } = await api.post(
		`/v1/me/mentoria/tool-instance/${instanceId}/complete`,
		completionPct !== undefined ? { completion_pct: completionPct } : {},
	);
	return data;
}

export async function getCompanyMap(journeyId: string): Promise<CompanyMap> {
	const { data } = await api.get(
		`/v1/me/mentoria/journey/${journeyId}/company-map`,
	);
	return data;
}

// Sub-recursos das ferramentas estruturadas
export async function listProcessFlows(
	instanceId: string,
): Promise<MntProcessFlow[]> {
	const { data } = await api.get(
		`/v1/me/mentoria/tool-instance/${instanceId}/process-flows`,
	);
	return data;
}

export async function createProcessFlow(
	instanceId: string,
	body: { name: string; description?: string | null },
): Promise<MntProcessFlow> {
	const { data } = await api.post(
		`/v1/me/mentoria/tool-instance/${instanceId}/process-flows`,
		body,
	);
	return data;
}

export async function deleteProcessFlow(flowId: string): Promise<void> {
	await api.delete(`/v1/me/mentoria/process-flow/${flowId}`);
}

export async function createProcessStep(
	flowId: string,
	body: Partial<MntProcessStep> & { name: string },
): Promise<MntProcessStep> {
	const { data } = await api.post(
		`/v1/me/mentoria/process-flow/${flowId}/steps`,
		body,
	);
	return data;
}

export async function updateProcessStep(
	stepId: string,
	body: Partial<MntProcessStep>,
): Promise<MntProcessStep> {
	const { data } = await api.patch(
		`/v1/me/mentoria/process-step/${stepId}`,
		body,
	);
	return data;
}

export async function deleteProcessStep(stepId: string): Promise<void> {
	await api.delete(`/v1/me/mentoria/process-step/${stepId}`);
}

export async function listOrgPositions(
	instanceId: string,
): Promise<MntOrgPosition[]> {
	const { data } = await api.get(
		`/v1/me/mentoria/tool-instance/${instanceId}/org-positions`,
	);
	return data;
}

export async function createOrgPosition(
	instanceId: string,
	body: Partial<MntOrgPosition> & { title: string },
): Promise<MntOrgPosition> {
	const { data } = await api.post(
		`/v1/me/mentoria/tool-instance/${instanceId}/org-positions`,
		body,
	);
	return data;
}

export async function updateOrgPosition(
	id: string,
	body: Partial<MntOrgPosition>,
): Promise<MntOrgPosition> {
	const { data } = await api.patch(`/v1/me/mentoria/org-position/${id}`, body);
	return data;
}

export async function deleteOrgPosition(id: string): Promise<void> {
	await api.delete(`/v1/me/mentoria/org-position/${id}`);
}

export async function listPops(instanceId: string): Promise<MntPop[]> {
	const { data } = await api.get(
		`/v1/me/mentoria/tool-instance/${instanceId}/pops`,
	);
	return data;
}

export async function createPop(
	instanceId: string,
	body: { title: string; steps?: string[] } & Record<string, unknown>,
): Promise<MntPop> {
	const { data } = await api.post(
		`/v1/me/mentoria/tool-instance/${instanceId}/pops`,
		body,
	);
	return data;
}

export async function updatePop(
	id: string,
	body: Record<string, unknown>,
): Promise<MntPop> {
	const { data } = await api.patch(`/v1/me/mentoria/pop/${id}`, body);
	return data;
}

export async function deletePop(id: string): Promise<void> {
	await api.delete(`/v1/me/mentoria/pop/${id}`);
}

export async function addPopAttachmentLink(
	popId: string,
	body: { kind?: string; url: string; name?: string | null },
): Promise<unknown> {
	const { data } = await api.post(
		`/v1/me/mentoria/pop/${popId}/attachment-link`,
		body,
	);
	return data;
}

export async function uploadPopAttachment(
	popId: string,
	file: File,
): Promise<unknown> {
	const form = new FormData();
	form.append('file', file);
	const { data } = await api.post(
		`/v1/me/mentoria/pop/${popId}/attachments`,
		form,
	);
	return data;
}

export async function listFinancialEntries(
	journeyId: string,
): Promise<MntFinancialEntry[]> {
	const { data } = await api.get(
		`/v1/me/mentoria/journey/${journeyId}/financial-entries`,
	);
	return data;
}

export async function createFinancialEntry(
	journeyId: string,
	body: Record<string, unknown> & { month: string },
): Promise<MntFinancialEntry> {
	const { data } = await api.post(
		`/v1/me/mentoria/journey/${journeyId}/financial-entries`,
		body,
	);
	return data;
}

export async function listFunnelStages(
	instanceId: string,
): Promise<MntFunnelStage[]> {
	const { data } = await api.get(
		`/v1/me/mentoria/tool-instance/${instanceId}/funnel-stages`,
	);
	return data;
}

export async function seedFunnelStages(
	instanceId: string,
): Promise<MntFunnelStage[]> {
	const { data } = await api.post(
		`/v1/me/mentoria/tool-instance/${instanceId}/funnel-stages/seed`,
	);
	return data;
}

export async function createFunnelStage(
	instanceId: string,
	body: { name: string; description?: string | null },
): Promise<MntFunnelStage> {
	const { data } = await api.post(
		`/v1/me/mentoria/tool-instance/${instanceId}/funnel-stages`,
		body,
	);
	return data;
}

export async function updateFunnelStage(
	stageId: string,
	body: { name?: string; description?: string | null },
): Promise<MntFunnelStage> {
	const { data } = await api.patch(
		`/v1/me/mentoria/funnel-stage/${stageId}`,
		body,
	);
	return data;
}

export async function deleteFunnelStage(stageId: string): Promise<void> {
	await api.delete(`/v1/me/mentoria/funnel-stage/${stageId}`);
}

/** Ordem nova, com todos os ids da ferramenta (do topo para o fundo). */
export async function reorderFunnelStages(
	instanceId: string,
	ids: string[],
): Promise<MntFunnelStage[]> {
	const { data } = await api.put(
		`/v1/me/mentoria/tool-instance/${instanceId}/funnel-stages/order`,
		{ ids },
	);
	return data;
}

export async function listImprovements(
	instanceId: string,
): Promise<MntImprovementCycle[]> {
	const { data } = await api.get(
		`/v1/me/mentoria/tool-instance/${instanceId}/improvements`,
	);
	return data;
}

export async function createImprovement(
	instanceId: string,
	body: Record<string, unknown> & { problem: string },
): Promise<MntImprovementCycle> {
	const { data } = await api.post(
		`/v1/me/mentoria/tool-instance/${instanceId}/improvements`,
		body,
	);
	return data;
}

export async function updateImprovement(
	id: string,
	body: Record<string, unknown>,
): Promise<MntImprovementCycle> {
	const { data } = await api.patch(`/v1/me/mentoria/improvement/${id}`, body);
	return data;
}

// ── Tarefas ──────────────────────────────────────────────────────────────────
export async function listTasks(
	journeyId: string,
	params?: { status?: string; origin_type?: string },
): Promise<MntTask[]> {
	const { data } = await api.get(`/v1/me/mentoria/journey/${journeyId}/tasks`, {
		params,
	});
	return data;
}

export async function createTask(
	journeyId: string,
	body: Record<string, unknown> & { title: string },
): Promise<MntTask> {
	const { data } = await api.post(
		`/v1/me/mentoria/journey/${journeyId}/tasks`,
		body,
	);
	return data;
}

export async function updateTask(
	taskId: string,
	body: Record<string, unknown>,
): Promise<MntTask> {
	const { data } = await api.patch(`/v1/me/mentoria/task/${taskId}`, body);
	return data;
}

export async function uploadTaskEvidence(
	taskId: string,
	file: File,
): Promise<unknown> {
	const form = new FormData();
	form.append('file', file);
	const { data } = await api.post(
		`/v1/me/mentoria/task/${taskId}/evidences`,
		form,
	);
	return data;
}

export async function addTaskEvidenceLink(
	taskId: string,
	body: { kind: 'link' | 'text'; url?: string | null; note?: string | null },
): Promise<unknown> {
	const { data } = await api.post(
		`/v1/me/mentoria/task/${taskId}/evidence-link`,
		body,
	);
	return data;
}

// ── KPIs ─────────────────────────────────────────────────────────────────────
export async function listKpis(
	journeyId: string,
	category?: string,
): Promise<MntKpi[]> {
	const { data } = await api.get(`/v1/me/mentoria/journey/${journeyId}/kpis`, {
		params: category ? { category } : undefined,
	});
	return data;
}

/** KPIs arquivados (active=false), para reativar. */
export async function listArchivedKpis(journeyId: string): Promise<MntKpi[]> {
	const { data } = await api.get(
		`/v1/me/mentoria/journey/${journeyId}/kpis/archived`,
	);
	return data;
}

export async function createKpi(
	journeyId: string,
	body: Record<string, unknown> & { name: string },
): Promise<MntKpi> {
	const { data } = await api.post(
		`/v1/me/mentoria/journey/${journeyId}/kpis`,
		body,
	);
	return data;
}

export async function updateKpi(
	kpiId: string,
	body: Record<string, unknown>,
): Promise<MntKpi> {
	const { data } = await api.patch(`/v1/me/mentoria/kpi/${kpiId}`, body);
	return data;
}

export async function addKpiMeasurement(
	kpiId: string,
	body: { value: number | null; measured_at: string; note?: string | null },
): Promise<MntKpiMeasurement> {
	const { data } = await api.post(
		`/v1/me/mentoria/kpi/${kpiId}/measurements`,
		body,
	);
	return data;
}

export async function getKpiHistory(
	kpiId: string,
): Promise<MntKpiMeasurement[]> {
	const { data } = await api.get(`/v1/me/mentoria/kpi/${kpiId}/history`);
	return data;
}

// ── Desenvolvimento pessoal ──────────────────────────────────────────────────
export async function getGoodNews(journeyId: string): Promise<GoodNewsState> {
	const { data } = await api.get(
		`/v1/me/mentoria/journey/${journeyId}/good-news`,
	);
	return data;
}

export async function postGoodNews(
	journeyId: string,
	news: string[],
): Promise<MntGoodNews> {
	const { data } = await api.post(
		`/v1/me/mentoria/journey/${journeyId}/good-news`,
		{ news },
	);
	return data;
}

export async function listGoals(journeyId: string): Promise<MntGoal[]> {
	const { data } = await api.get(`/v1/me/mentoria/journey/${journeyId}/goals`);
	return data;
}

export async function createGoal(
	journeyId: string,
	body: Record<string, unknown> & { title: string },
): Promise<MntGoal> {
	const { data } = await api.post(
		`/v1/me/mentoria/journey/${journeyId}/goals`,
		body,
	);
	return data;
}

export async function updateGoal(
	goalId: string,
	body: Record<string, unknown>,
): Promise<MntGoal> {
	const { data } = await api.patch(`/v1/me/mentoria/goal/${goalId}`, body);
	return data;
}

export async function submitMaslow(
	journeyId: string,
	answers: number[],
): Promise<MntMaslowTest> {
	const { data } = await api.post(
		`/v1/me/mentoria/journey/${journeyId}/maslow`,
		{ answers },
	);
	return data;
}

export async function getMaslowHistory(
	journeyId: string,
): Promise<MntMaslowTest[]> {
	const { data } = await api.get(
		`/v1/me/mentoria/journey/${journeyId}/maslow/history`,
	);
	return data;
}

export async function listBusinessPlans(
	journeyId: string,
): Promise<MntBusinessPlanVersion[]> {
	const { data } = await api.get(
		`/v1/me/mentoria/journey/${journeyId}/business-plan/versions`,
	);
	return data;
}

export async function createBusinessPlan(
	journeyId: string,
	body: { label?: string | null; content: Record<string, unknown> },
): Promise<MntBusinessPlanVersion> {
	const { data } = await api.post(
		`/v1/me/mentoria/journey/${journeyId}/business-plan`,
		body,
	);
	return data;
}

// ── Materiais / Relatórios ───────────────────────────────────────────────────
export async function listMyMaterials(): Promise<MntMaterial[]> {
	const { data } = await api.get('/v1/me/mentoria/materials');
	return data;
}

export async function listSnapshots(journeyId: string): Promise<MntSnapshot[]> {
	const { data } = await api.get(
		`/v1/me/mentoria/journey/${journeyId}/snapshots`,
	);
	return data;
}

export async function createSnapshot(
	journeyId: string,
	body: { kind: 'monthly' | 'final'; label?: string | null },
): Promise<MntSnapshot> {
	const { data } = await api.post(
		`/v1/me/mentoria/journey/${journeyId}/snapshots`,
		body,
	);
	return data;
}

export async function compare(
	journeyId: string,
	from: string,
	to: string,
): Promise<Comparison> {
	const { data } = await api.get(
		`/v1/me/mentoria/journey/${journeyId}/compare`,
		{ params: { from, to } },
	);
	return data;
}

export async function generateRaiox(journeyId: string): Promise<MntReport> {
	const { data } = await api.post(
		`/v1/me/mentoria/journey/${journeyId}/reports/raiox-final`,
	);
	return data;
}

export async function listReports(journeyId: string): Promise<MntReport[]> {
	const { data } = await api.get(
		`/v1/me/mentoria/journey/${journeyId}/reports`,
	);
	return data;
}

// ── Assistente de IA ─────────────────────────────────────────────────────────
/** Manda a conversa da sessão; a API monta o contexto da jornada. */
export async function askAssistant(
	journeyId: string,
	messages: AssistantMessage[],
): Promise<AssistantReply> {
	const { data } = await api.post(
		`/v1/me/mentoria/journey/${journeyId}/assistant`,
		{ messages },
	);
	return data;
}

export async function getAssistantUsage(
	journeyId: string,
): Promise<AssistantUsage> {
	const { data } = await api.get(
		`/v1/me/mentoria/journey/${journeyId}/assistant/usage`,
	);
	return data;
}

export async function getReport(reportId: string): Promise<MntReport> {
	const { data } = await api.get(`/v1/me/mentoria/report/${reportId}`);
	return data;
}

// ── Lives ────────────────────────────────────────────────────────────────────
export async function listMyLives(): Promise<MntLiveRoom[]> {
	const { data } = await api.get('/v1/me/mentoria/lives');
	return data;
}

export async function getLive(liveId: string): Promise<MntLiveRoom> {
	const { data } = await api.get(`/v1/me/mentoria/live/${liveId}`);
	return data;
}

export async function getLivePlayback(liveId: string): Promise<LivePlayback> {
	const { data } = await api.get(`/v1/me/mentoria/live/${liveId}/playback`);
	return data;
}

export async function listLiveChat(
	liveId: string,
): Promise<MntLiveChatMessage[]> {
	const { data } = await api.get(`/v1/me/mentoria/live/${liveId}/chat`);
	return data;
}

export async function postLiveChat(
	liveId: string,
	body: string,
): Promise<MntLiveChatMessage> {
	const { data } = await api.post(`/v1/me/mentoria/live/${liveId}/chat`, {
		body,
	});
	return data;
}

// ── Mentor ───────────────────────────────────────────────────────────────────
export async function listMyCohorts(): Promise<MntCohort[]> {
	const { data } = await api.get('/v1/mentoria/cohorts');
	return data;
}

export async function getCohortDashboard(
	cohortId: string,
): Promise<CohortDashboardRow[]> {
	const { data } = await api.get(`/v1/mentoria/cohort/${cohortId}/dashboard`);
	return data;
}

export async function getJourneyOverview(
	journeyId: string,
): Promise<MentoriaBootstrap> {
	const { data } = await api.get(`/v1/mentoria/journey/${journeyId}/overview`);
	return data;
}

/** Vazio ou null apaga o feedback. */
export async function setMeetingFeedback(
	meetingId: string,
	feedback: string | null,
): Promise<MntJourneyMeeting> {
	const { data } = await api.post(
		`/v1/mentoria/meeting/${meetingId}/feedback`,
		{
			feedback,
		},
	);
	return data;
}

/** ISO com fuso; null tira o agendamento. */
export async function scheduleMeeting(
	meetingId: string,
	scheduledAt: string | null,
): Promise<MntJourneyMeeting> {
	const { data } = await api.put(`/v1/mentoria/meeting/${meetingId}/schedule`, {
		scheduled_at: scheduledAt,
	});
	return data;
}

export async function validateMeeting(
	meetingId: string,
): Promise<MntJourneyMeeting> {
	const { data } = await api.post(`/v1/mentoria/meeting/${meetingId}/validate`);
	return data;
}

export async function listJourneyTasksAsMentor(
	journeyId: string,
): Promise<MntTask[]> {
	const { data } = await api.get(`/v1/mentoria/journey/${journeyId}/tasks`);
	return data;
}

/** Entra no histórico e vira o atual; vazio/null só limpa o atual. */
export async function commentTaskAsMentor(
	taskId: string,
	comment: string | null,
): Promise<MntTask> {
	const { data } = await api.post(`/v1/mentoria/task/${taskId}/comment`, {
		comment,
	});
	return data;
}

export async function listTaskCommentsAsMentor(
	taskId: string,
): Promise<MntTaskComment[]> {
	const { data } = await api.get(`/v1/mentoria/task/${taskId}/comments`);
	return data;
}

// Selo "Validada pelo mentor" da tela do aluno: não havia chamada no front.
export async function validateTaskAsMentor(taskId: string): Promise<MntTask> {
	const { data } = await api.post(`/v1/mentoria/task/${taskId}/validate`);
	return data;
}

export async function listJourneyKpisAsMentor(
	journeyId: string,
): Promise<MntKpi[]> {
	const { data } = await api.get(`/v1/mentoria/journey/${journeyId}/kpis`);
	return data;
}

/** Selo do mentor na ferramenta (entra no score de maturidade). */
export async function validateToolInstance(
	instanceId: string,
): Promise<MntToolInstance> {
	const { data } = await api.post(
		`/v1/mentoria/tool-instance/${instanceId}/validate`,
	);
	return data;
}

export async function unvalidateToolInstance(
	instanceId: string,
): Promise<MntToolInstance> {
	const { data } = await api.delete(
		`/v1/mentoria/tool-instance/${instanceId}/validate`,
	);
	return data;
}

export async function getCompanyMapAsMentor(
	journeyId: string,
): Promise<CompanyMap> {
	const { data } = await api.get(
		`/v1/mentoria/journey/${journeyId}/company-map`,
	);
	return data;
}

export async function listSubmissionsAsMentor(
	journeyId: string,
): Promise<MntFormSubmission[]> {
	const { data } = await api.get(
		`/v1/mentoria/journey/${journeyId}/form-submissions`,
	);
	return data;
}

export async function getDiagnosticAsMentor(
	journeyId: string,
): Promise<DiagnosticState> {
	const { data } = await api.get(
		`/v1/mentoria/journey/${journeyId}/diagnostic`,
	);
	return data;
}

// Visão 360° do mentor: as mesmas leituras do aluno, só leitura.
export async function listDiagnosticReopensAsMentor(
	journeyId: string,
): Promise<DiagnosticReopen[]> {
	const { data } = await api.get(
		`/v1/mentoria/journey/${journeyId}/diagnostic/reopens`,
	);
	return data;
}

export async function getToolContentAsMentor(
	journeyId: string,
): Promise<MentorToolContent> {
	const { data } = await api.get(
		`/v1/mentoria/journey/${journeyId}/tool-content`,
	);
	return data;
}

export async function getGoodNewsAsMentor(
	journeyId: string,
): Promise<GoodNewsState> {
	const { data } = await api.get(`/v1/mentoria/journey/${journeyId}/good-news`);
	return data;
}

export async function listGoalsAsMentor(journeyId: string): Promise<MntGoal[]> {
	const { data } = await api.get(`/v1/mentoria/journey/${journeyId}/goals`);
	return data;
}

export async function getMaslowHistoryAsMentor(
	journeyId: string,
): Promise<MntMaslowTest[]> {
	const { data } = await api.get(
		`/v1/mentoria/journey/${journeyId}/maslow/history`,
	);
	return data;
}

export async function listBusinessPlansAsMentor(
	journeyId: string,
): Promise<MntBusinessPlanVersion[]> {
	const { data } = await api.get(
		`/v1/mentoria/journey/${journeyId}/business-plan/versions`,
	);
	return data;
}

export async function listSnapshotsAsMentor(
	journeyId: string,
): Promise<MntSnapshot[]> {
	const { data } = await api.get(`/v1/mentoria/journey/${journeyId}/snapshots`);
	return data;
}

export async function compareAsMentor(
	journeyId: string,
	from: string,
	to: string,
): Promise<Comparison> {
	const { data } = await api.get(`/v1/mentoria/journey/${journeyId}/compare`, {
		params: { from, to },
	});
	return data;
}

/** Um relatório pela rota do mentor (checa a turma, não a posse). */
export async function getReportAsMentor(reportId: string): Promise<MntReport> {
	const { data } = await api.get(`/v1/mentoria/report/${reportId}`);
	return data;
}

export async function listReportsAsMentor(
	journeyId: string,
): Promise<MntReport[]> {
	const { data } = await api.get(`/v1/mentoria/journey/${journeyId}/reports`);
	return data;
}

// ── Admin ────────────────────────────────────────────────────────────────────
/** Encerra (completed) ou reativa (active) a jornada. */
export async function setJourneyStatus(
	journeyId: string,
	status: MntJourney['status'],
): Promise<MntJourney> {
	const { data } = await api.patch(`/v1/admin/mentoria/journey/${journeyId}`, {
		status,
	});
	return data;
}

/** Reabre o diagnóstico: apaga a Foto Zero e devolve o envio para rascunho. */
export async function reopenDiagnostic(
	journeyId: string,
	reason: string | null,
): Promise<DiagnosticState> {
	const { data } = await api.post(
		`/v1/admin/mentoria/journey/${journeyId}/diagnostic/reopen`,
		{ reason },
	);
	return data;
}

export async function listCohortsAdmin(): Promise<MntCohort[]> {
	const { data } = await api.get('/v1/admin/mentoria/cohorts');
	return data;
}

export async function createCohort(
	body: Record<string, unknown> & { name: string },
): Promise<MntCohort> {
	const { data } = await api.post('/v1/admin/mentoria/cohorts', body);
	return data;
}

export async function updateCohort(
	id: string,
	body: Record<string, unknown>,
): Promise<MntCohort> {
	const { data } = await api.patch(`/v1/admin/mentoria/cohort/${id}`, body);
	return data;
}

export async function addCohortMentor(
	cohortId: string,
	body: { mentor_user_id: string; role?: 'lead' | 'assistant' },
): Promise<unknown> {
	const { data } = await api.post(
		`/v1/admin/mentoria/cohort/${cohortId}/mentors`,
		body,
	);
	return data;
}

export async function listCohortMentors(
	cohortId: string,
): Promise<MntCohortMentor[]> {
	const { data } = await api.get(
		`/v1/admin/mentoria/cohort/${cohortId}/mentors`,
	);
	return data;
}

export async function removeCohortMentor(
	cohortId: string,
	mentorUserId: string,
): Promise<void> {
	await api.delete(
		`/v1/admin/mentoria/cohort/${cohortId}/mentors/${mentorUserId}`,
	);
}

export async function enrollStudent(
	cohortId: string,
	body: { user_id: string; company_name?: string },
): Promise<MntJourney> {
	const { data } = await api.post(
		`/v1/admin/mentoria/cohort/${cohortId}/enroll`,
		body,
	);
	return data;
}

/** Matrícula em lote: um erro não para os outros (resultado por aluno). */
export async function enrollStudentsBatch(
	cohortId: string,
	userIds: string[],
): Promise<EnrollBatchResult> {
	const { data } = await api.post(
		`/v1/admin/mentoria/cohort/${cohortId}/enroll-batch`,
		{ user_ids: userIds },
	);
	return data;
}

/** Fila "Aguardando turma" (admin). */
export async function listWaitingStudents(): Promise<MentoriaWaitingStudent[]> {
	const { data } = await api.get('/v1/admin/mentoria/waiting-students');
	return data;
}

export async function listMeetingTemplatesAdmin(): Promise<
	MntMeetingTemplate[]
> {
	const { data } = await api.get('/v1/admin/mentoria/meeting-templates');
	return data;
}

export async function createMeetingTemplate(
	body: Record<string, unknown> & { position: number; title: string },
): Promise<MntMeetingTemplate> {
	const { data } = await api.post('/v1/admin/mentoria/meeting-templates', body);
	return data;
}

export async function publishMeetingTemplate(
	id: string,
): Promise<MntMeetingTemplate & { journeys_updated?: number }> {
	const { data } = await api.post(
		`/v1/admin/mentoria/meeting-template/${id}/publish`,
	);
	return data;
}

export async function getMeetingTemplatePublishImpact(
	id: string,
): Promise<MeetingTemplatePublishImpact> {
	const { data } = await api.get(
		`/v1/admin/mentoria/meeting-template/${id}/publish-impact`,
	);
	return data;
}

export async function unpublishMeetingTemplate(
	id: string,
): Promise<UnpublishedMeetingTemplate> {
	const { data } = await api.post(
		`/v1/admin/mentoria/meeting-template/${id}/unpublish`,
	);
	return data;
}

export async function deleteMeetingTemplate(id: string): Promise<void> {
	await api.delete(`/v1/admin/mentoria/meeting-template/${id}`);
}

export async function listFormTemplatesAdmin(): Promise<MntFormTemplate[]> {
	const { data } = await api.get('/v1/admin/mentoria/form-templates');
	return data;
}

export async function createFormTemplate(
	body: Record<string, unknown> & { key: string; title: string },
): Promise<MntFormTemplate> {
	const { data } = await api.post('/v1/admin/mentoria/form-templates', body);
	return data;
}

export async function publishFormTemplate(
	id: string,
): Promise<MntFormTemplate> {
	const { data } = await api.post(
		`/v1/admin/mentoria/form-template/${id}/publish`,
	);
	return data;
}

export async function listToolDefinitionsAdmin(): Promise<MntToolDefinition[]> {
	const { data } = await api.get('/v1/admin/mentoria/tool-definitions');
	return data;
}

/** Edita nome/descrição/área/posição/ativa. key e kind são fixos. */
export async function patchToolDefinition(
	id: string,
	body: Partial<
		Pick<
			MntToolDefinition,
			'name' | 'description' | 'area' | 'position' | 'active'
		>
	>,
): Promise<MntToolDefinition> {
	const { data } = await api.patch(
		`/v1/admin/mentoria/tool-definition/${id}`,
		body,
	);
	return data;
}

/** 409 tool_definition_in_use (details.instances) → confirmar com force. */
export async function deleteToolDefinition(
	id: string,
	force = false,
): Promise<{ deleted: true; instances_removed: number }> {
	const { data } = await api.delete(
		`/v1/admin/mentoria/tool-definition/${id}`,
		{ params: force ? { force: 'true' } : undefined },
	);
	return data;
}

export async function upsertToolDefinition(
	body: Record<string, unknown> & { key: string; name: string },
): Promise<MntToolDefinition> {
	const { data } = await api.post('/v1/admin/mentoria/tool-definitions', body);
	return data;
}

export async function listMaterialsAdmin(): Promise<MntMaterial[]> {
	const { data } = await api.get('/v1/admin/mentoria/materials');
	return data;
}

export async function createMaterialLink(
	body: Record<string, unknown> & { title: string; url: string },
): Promise<MntMaterial> {
	const { data } = await api.post('/v1/admin/mentoria/materials/link', body);
	return data;
}

/** `onProgress` recebe 0–100 enquanto o arquivo sobe. */
export async function uploadMaterial(
	file: File,
	params: UploadMaterialParams,
	onProgress?: (pct: number) => void,
): Promise<MntMaterial> {
	const form = new FormData();
	form.append('file', file);
	const { data } = await api.post('/v1/admin/mentoria/materials', form, {
		params,
		onUploadProgress: (e) => {
			if (onProgress && e.total) {
				onProgress(Math.round((e.loaded / e.total) * 100));
			}
		},
	});
	return data;
}

export async function updateMaterial(
	id: string,
	body: Partial<
		Pick<
			MntMaterial,
			'title' | 'description' | 'cohort_id' | 'meeting_template_id' | 'url'
		>
	>,
): Promise<MntMaterial> {
	const { data } = await api.patch(`/v1/admin/mentoria/material/${id}`, body);
	return data;
}

export async function deleteMaterial(id: string): Promise<void> {
	await api.delete(`/v1/admin/mentoria/material/${id}`);
}

export async function listLivesAdmin(): Promise<MntLiveRoom[]> {
	const { data } = await api.get('/v1/admin/mentoria/lives');
	return data;
}

export async function createLive(
	body: Record<string, unknown> & { title: string },
): Promise<MntLiveRoom> {
	const { data } = await api.post('/v1/admin/mentoria/lives', body);
	return data;
}

export async function getLiveCredentials(id: string): Promise<LiveCredentials> {
	const { data } = await api.get(`/v1/admin/mentoria/live/${id}/credentials`);
	return data;
}

/**
 * Coloca uma live de link externo no ar. Só existe para `source: 'external'`:
 * nas do Mux quem vira o status é o webhook da transmissão.
 */
export async function startLive(id: string): Promise<MntLiveRoom> {
	const { data } = await api.post(`/v1/admin/mentoria/live/${id}/start`);
	return data;
}

/**
 * Encerra a live. No link externo o admin pode colar a gravação na hora — não
 * existe VOD automático como no Mux —, e aí a sala já vira `vod_ready`.
 */
export async function endLive(
	id: string,
	recordingUrl?: string | null,
): Promise<MntLiveRoom> {
	const { data } = await api.post(
		`/v1/admin/mentoria/live/${id}/end`,
		recordingUrl ? { recording_url: recordingUrl } : undefined,
	);
	return data;
}

/**
 * Edita a sala (título, agenda, turma e, no link externo, os links). Numa sala
 * externa já encerrada, `recording_url` publica a gravação (vira `vod_ready`)
 * ou, com null, a despublica.
 */
export async function updateLive(
	id: string,
	body: Record<string, unknown>,
): Promise<MntLiveRoom> {
	const { data } = await api.patch(`/v1/admin/mentoria/live/${id}`, body);
	return data;
}

export async function listMaturityConfigs(): Promise<MntMaturityConfig[]> {
	const { data } = await api.get('/v1/admin/mentoria/maturity-configs');
	return data;
}

export async function createMaturityConfig(body: {
	program_key?: string;
	formula: Record<string, unknown>;
	active?: boolean;
}): Promise<MntMaturityConfig> {
	const { data } = await api.post('/v1/admin/mentoria/maturity-configs', body);
	return data;
}

// ── Admin: liberação restrita ────────────────────────────────────────────────
/** Bloqueia/libera a seção Ferramentas para todos os alunos. */
export async function setToolsLock(
	locked: boolean,
): Promise<MentoriaAccessAdmin> {
	const { data } = await api.put('/v1/admin/mentoria/tools-lock', { locked });
	return data;
}

export async function getMentoriaAccessAdmin(): Promise<MentoriaAccessAdmin> {
	const { data } = await api.get('/v1/admin/mentoria/access');
	return data;
}

export async function updateMentoriaAccess(body: {
	restricted: boolean;
	user_ids: string[];
}): Promise<MentoriaAccessAdmin> {
	const { data } = await api.put('/v1/admin/mentoria/access', body);
	return data;
}
