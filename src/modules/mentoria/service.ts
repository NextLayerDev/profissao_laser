// Chamadas HTTP da aba Mentoria — TODAS na upvox-api (/v1) via apiCourses.
import { apiCourses as api } from '@/shared/lib/api-courses';
import type {
	CohortDashboardRow,
	CompanyMap,
	Comparison,
	DiagnosticState,
	GoodNewsState,
	LiveCredentials,
	LivePlayback,
	MentoriaBootstrap,
	MntBusinessPlanVersion,
	MntCohort,
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
	MntToolDefinition,
	MntToolInstance,
	ToolWithInstance,
} from './types';

// ── Mentorado: núcleo ────────────────────────────────────────────────────────
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
	const { data } = await api.get(`/v1/me/mentoria/journey/${journeyId}/meetings`);
	return data;
}

export async function completeMeeting(
	meetingId: string,
): Promise<MntJourneyMeeting> {
	const { data } = await api.post(`/v1/me/mentoria/meeting/${meetingId}/complete`);
	return data;
}

// ── Diagnóstico / Formulários ────────────────────────────────────────────────
export async function getDiagnostic(journeyId: string): Promise<DiagnosticState> {
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
	const { data } = await api.get(`/v1/me/mentoria/journey/${journeyId}/reports`);
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

export async function setMeetingFeedback(
	meetingId: string,
	feedback: string,
): Promise<MntJourneyMeeting> {
	const { data } = await api.post(`/v1/mentoria/meeting/${meetingId}/feedback`, {
		feedback,
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

export async function commentTaskAsMentor(
	taskId: string,
	comment: string,
): Promise<MntTask> {
	const { data } = await api.post(`/v1/mentoria/task/${taskId}/comment`, {
		comment,
	});
	return data;
}

export async function listJourneyKpisAsMentor(
	journeyId: string,
): Promise<MntKpi[]> {
	const { data } = await api.get(`/v1/mentoria/journey/${journeyId}/kpis`);
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

// ── Admin ────────────────────────────────────────────────────────────────────
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

export async function listMeetingTemplatesAdmin(): Promise<MntMeetingTemplate[]> {
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
): Promise<MntMeetingTemplate> {
	const { data } = await api.post(
		`/v1/admin/mentoria/meeting-template/${id}/publish`,
	);
	return data;
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

export async function publishFormTemplate(id: string): Promise<MntFormTemplate> {
	const { data } = await api.post(
		`/v1/admin/mentoria/form-template/${id}/publish`,
	);
	return data;
}

export async function listToolDefinitionsAdmin(): Promise<MntToolDefinition[]> {
	const { data } = await api.get('/v1/admin/mentoria/tool-definitions');
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

export async function uploadMaterial(
	file: File,
	params: { title: string; cohort_id?: string; meeting_template_id?: string },
): Promise<MntMaterial> {
	const form = new FormData();
	form.append('file', file);
	const { data } = await api.post('/v1/admin/mentoria/materials', form, {
		params,
	});
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

export async function endLive(id: string): Promise<MntLiveRoom> {
	const { data } = await api.post(`/v1/admin/mentoria/live/${id}/end`);
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
