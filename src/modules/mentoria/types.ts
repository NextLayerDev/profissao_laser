// Tipos da aba Mentoria (Profissão Laser 360°) — espelham a upvox-api /v1.

export type MntCompany = {
	id: string;
	owner_user_id: string;
	name: string;
	cnpj: string | null;
	segment: string | null;
	city: string | null;
	state: string | null;
	phone: string | null;
	email: string | null;
	instagram: string | null;
	website: string | null;
	founded_at: string | null;
	logo_url: string | null;
	created_at: string;
	updated_at: string;
};

export type MntCohort = {
	id: string;
	name: string;
	program_key: string;
	starts_at: string | null;
	ends_at: string | null;
	status: 'draft' | 'active' | 'completed' | 'archived';
	created_at: string;
	updated_at: string;
};

export type MntCohortMentor = {
	cohort_id: string;
	mentor_user_id: string;
	role: 'lead' | 'assistant';
	created_at: string;
	user: { id: string; name: string | null; email: string } | null;
};

export type MntJourney = {
	id: string;
	company_id: string;
	cohort_id: string;
	status: 'active' | 'completed' | 'abandoned';
	maturity_score: number | null;
	started_at: string;
	completed_at: string | null;
	created_at: string;
	updated_at: string;
};

export type MeetingTaskPrompt = {
	title: string;
	description?: string;
	priority?: 'low' | 'medium' | 'high';
};

export type MntMeetingTemplate = {
	id: string;
	program_key: string;
	position: number;
	version: number;
	title: string;
	subtitle: string | null;
	description: string | null;
	objectives: string | null;
	content_md: string | null;
	tool_definition_ids: string[];
	exercise_form_template_id: string | null;
	task_prompts: MeetingTaskPrompt[];
	indicator_hint: unknown;
	expected_result: string | null;
	is_final: boolean;
	published: boolean;
	created_at: string;
	updated_at: string;
};

export type MntJourneyMeeting = {
	id: string;
	journey_id: string;
	meeting_template_id: string;
	template_version: number;
	position: number;
	status: 'locked' | 'available' | 'in_progress' | 'done';
	scheduled_at: string | null;
	student_completed_at: string | null;
	mentor_feedback: string | null;
	mentor_validated_by: string | null;
	mentor_validated_at: string | null;
	created_at: string;
	updated_at: string;
	template?: MntMeetingTemplate | null;
};

/** Aluno liberado na Mentoria quando a restrição está ligada. */
export type MentoriaAccessStudent = {
	id: string;
	name: string | null;
	email: string;
};

/**
 * `reason='restricted'`: o admin limitou a Mentoria e o aluno não está na
 * lista — some do menu. `'required'`: sem o plano (a matrícula sozinha não
 * basta) — o menu continua
 * mostrando e o SubscriptionGate oferece o plano.
 */
export type MyMentoriaAccess = {
	has_access: boolean;
	reason: 'required' | 'restricted' | null;
	/** Seção Ferramentas bloqueada pelo admin (ausente em API antiga). */
	tools_locked?: boolean;
};

/** Fila "Aguardando turma": aluno com o plano da Mentoria e sem jornada ativa. */
export type MentoriaWaitingStudent = {
	user_id: string;
	name: string | null;
	email: string;
	company_name: string | null;
	plan_name: string | null;
	/** Início da assinatura mais antiga com a Mentoria. */
	since: string;
};

export type EnrollBatchResult = {
	enrolled: number;
	failed: number;
	results: Array<{
		user_id: string;
		ok: boolean;
		journey_id: string | null;
		/** Código do erro da API (ex.: `journey_already_active`). */
		error: string | null;
	}>;
};

export type MentoriaAccessAdmin = {
	restricted: boolean;
	tools_locked?: boolean;
	students: MentoriaAccessStudent[];
};

export type MentoriaBootstrap = {
	has_access: boolean;
	company: MntCompany | null;
	journey: MntJourney | null;
	cohort: MntCohort | null;
	meetings: MntJourneyMeeting[];
	progress: {
		meetings_total: number;
		meetings_done: number;
		progress_pct: number;
	};
};

export type CohortDashboardRow = {
	journey_id: string;
	company: MntCompany;
	owner_email: string | null;
	owner_name: string | null;
	meetings_total: number;
	meetings_done: number;
	progress_pct: number;
	status: string;
};

// ── Formulários data-driven ──────────────────────────────────────────────────
export type FormFieldType =
	| 'text'
	| 'textarea'
	| 'number'
	| 'currency'
	| 'select'
	| 'multiselect'
	| 'boolean'
	| 'date'
	| 'scale'
	| 'file';

export type FormField = {
	key: string;
	label: string;
	type: FormFieldType;
	required?: boolean;
	options?: string[];
	allow_unknown?: boolean;
	metric_key?: string;
};

export type FormBlock = {
	key: string;
	title: string;
	description?: string;
	fields: FormField[];
};

export type MntFormTemplate = {
	id: string;
	key: string;
	version: number;
	title: string;
	description: string | null;
	schema: { blocks: FormBlock[] };
	published: boolean;
	created_at: string;
	updated_at: string;
};

/** Resposta "[A LEVANTAR / NÃO MEDIDO]" de um campo com allow_unknown. */
export const UNKNOWN_ANSWER = { $unknown: true } as const;
export function isUnknownAnswer(value: unknown): boolean {
	return (
		typeof value === 'object' && value !== null && $unknownOf(value) === true
	);
}
function $unknownOf(value: object): unknown {
	return (value as Record<string, unknown>).$unknown;
}

export type SubmissionContext =
	| 'diagnostic'
	| 'meeting_exercise'
	| 'tool'
	| 'final_assessment';

export type MntFormSubmission = {
	id: string;
	journey_id: string;
	form_template_id: string;
	context: SubmissionContext;
	context_ref_id: string | null;
	version: number;
	answers: Record<string, unknown>;
	status: 'draft' | 'submitted';
	submitted_at: string | null;
	created_at: string;
	updated_at: string;
};

export type MntSnapshot = {
	id: string;
	journey_id: string;
	kind: 'foto_zero' | 'meeting' | 'monthly' | 'final';
	label: string | null;
	payload: Record<string, unknown>;
	metrics: Record<string, unknown>;
	taken_at: string;
};

export type DiagnosticState = {
	template: MntFormTemplate | null;
	draft: MntFormSubmission | null;
	submitted: MntFormSubmission | null;
	foto_zero: MntSnapshot | null;
};

// ── Ferramentas ──────────────────────────────────────────────────────────────
export type ToolArea =
	| 'estrategia'
	| 'processos'
	| 'pessoas'
	| 'indicadores'
	| 'financeiro'
	| 'comercial'
	| 'melhoria'
	| 'pessoal';

export type ToolKind =
	| 'form'
	| 'kpi_board'
	| 'process_flow'
	| 'org_chart'
	| 'pop_library'
	| 'financial_panel'
	| 'sales_funnel'
	| 'continuous_improvement'
	| 'goal_action'
	| 'maslow'
	| 'good_news'
	| 'business_plan';

export type MntToolDefinition = {
	id: string;
	key: string;
	name: string;
	description: string | null;
	area: ToolArea;
	kind: ToolKind;
	form_template_key: string | null;
	config: Record<string, unknown>;
	icon: string | null;
	position: number;
	active: boolean;
};

export type MntToolInstance = {
	id: string;
	journey_id: string;
	tool_definition_id: string;
	status: 'not_started' | 'in_progress' | 'completed';
	/** Calculado pela API a partir do que foi preenchido. */
	completion_pct: number;
	completed_at: string | null;
	/** "Marcar como concluída" à mão (override do cálculo). */
	manual_completed_at?: string | null;
	/** Selo do mentor. */
	mentor_validated_at?: string | null;
	mentor_validated_by?: string | null;
};

export type ToolWithInstance = MntToolDefinition & {
	instance: MntToolInstance | null;
};

export type CompanyMap = {
	areas: Array<{
		area: ToolArea;
		maturity_pct: number;
		tools: Array<{
			key: string;
			name: string;
			kind?: ToolKind;
			instance_id?: string | null;
			completion_pct: number;
			status: string;
			validated?: boolean;
			validated_at?: string | null;
		}>;
	}>;
	overall_pct: number;
	/** Com ferramenta validada, o geral conta só as validadas. */
	basis?: 'validated' | 'self_declared';
	validated_count?: number;
	self_declared_pct?: number;
};

export type MntProcessStep = {
	id: string;
	flow_id: string;
	position: number;
	name: string;
	description: string | null;
	owner_name: string | null;
	deadline: string | null;
	tool_used: string | null;
	problem_note: string | null;
};

export type MntProcessFlow = {
	id: string;
	tool_instance_id: string;
	name: string;
	description: string | null;
	steps: MntProcessStep[];
};

export type MntOrgPosition = {
	id: string;
	tool_instance_id: string;
	parent_id: string | null;
	title: string;
	holder_name: string | null;
	responsibilities: string | null;
	kpi_names: string | null;
};

export type MntPop = {
	id: string;
	tool_instance_id: string;
	title: string;
	objective: string | null;
	owner_name: string | null;
	materials: string | null;
	control_point: string | null;
	expected_result: string | null;
	reviewed_at: string | null;
	steps: Array<{ id: string; position: number; instruction: string }>;
	attachments: Array<{
		id: string;
		kind: 'photo' | 'video' | 'doc' | 'link';
		url: string;
		name: string | null;
	}>;
};

export type MntFinancialEntry = {
	id: string;
	journey_id: string;
	month: string;
	version: number;
	revenue: number | null;
	fixed_costs: number | null;
	variable_costs: number | null;
	payroll: number | null;
	marketing: number | null;
	taxes: number | null;
	pro_labore: number | null;
	investments: number | null;
	operating_result: number | null;
	profit: number | null;
	margin_pct: number | null;
	notes: string | null;
	created_at: string;
};

export type MntFunnelStage = {
	id: string;
	tool_instance_id: string;
	position: number;
	name: string;
	description: string | null;
};

export type MntImprovementCycle = {
	id: string;
	tool_instance_id: string;
	problem: string;
	root_cause: string | null;
	action_plan: string | null;
	owner_name: string | null;
	deadline: string | null;
	result: string | null;
	standardized: boolean;
	linked_pop_id: string | null;
	status: 'open' | 'in_progress' | 'done';
};

// ── Tarefas ──────────────────────────────────────────────────────────────────
export type TaskStatus =
	| 'pending'
	| 'in_progress'
	| 'done'
	| 'overdue'
	| 'cancelled';

export type MntTaskEvidence = {
	id: string;
	task_id: string;
	kind: 'photo' | 'video' | 'doc' | 'link' | 'text';
	url: string | null;
	note: string | null;
	created_at: string;
};

export type MntTask = {
	id: string;
	journey_id: string;
	title: string;
	description: string | null;
	origin_type:
		| 'meeting'
		| 'tool'
		| 'goal'
		| 'improvement'
		| 'manual'
		| 'mentor';
	origin_id: string | null;
	due_date: string | null;
	priority: 'low' | 'medium' | 'high';
	status: TaskStatus;
	completed_at: string | null;
	mentor_comment: string | null;
	mentor_validated_at: string | null;
	created_at: string;
	evidences: MntTaskEvidence[];
};

// ── KPIs ─────────────────────────────────────────────────────────────────────
export type Semaphore = 'green' | 'yellow' | 'red' | 'unmeasured';

export type MntKpiMeasurement = {
	id: string;
	kpi_id: string;
	value: number | null;
	measured_at: string;
	note: string | null;
	created_at: string;
};

/** Chaves que o comparador entende (as mesmas da Foto Zero). */
export const KPI_METRIC_OPTIONS = [
	{ value: 'faturamento', label: 'Faturamento' },
	{ value: 'ticket', label: 'Ticket médio' },
	{ value: 'vendas', label: 'Vendas' },
	{ value: 'margem', label: 'Margem' },
	{ value: 'recorrencia', label: 'Recorrência' },
	{ value: 'funcionarios', label: 'Funcionários' },
	{ value: 'custos_fixos', label: 'Custos fixos' },
	{ value: 'equipamentos', label: 'Equipamentos' },
] as const;
export type KpiMetricKey = (typeof KPI_METRIC_OPTIONS)[number]['value'];

export type MntKpi = {
	id: string;
	journey_id: string;
	tool_instance_id: string | null;
	name: string;
	category: string;
	unit: string | null;
	target: number | null;
	direction: 'up_good' | 'down_good';
	periodicity: 'daily' | 'weekly' | 'monthly';
	owner_name: string | null;
	semaphore: { green_pct: number; yellow_pct: number };
	active: boolean;
	/** Chave do comparador ("Agora") — ver KPI_METRIC_OPTIONS. */
	metric_key?: KpiMetricKey | null;
	latest_measurement?: MntKpiMeasurement | null;
	current_semaphore?: Semaphore;
};

// ── Desenvolvimento pessoal ──────────────────────────────────────────────────
export type MntGoodNews = {
	id: string;
	journey_id: string;
	news: string[];
	posted_on: string;
	created_at: string;
};

export type GoodNewsState = {
	entries: MntGoodNews[];
	current_streak: number;
	longest_streak: number;
	streak_goal: number;
	posted_today: boolean;
};

export type MntGoal = {
	id: string;
	journey_id: string;
	title: string;
	indicator_text: string | null;
	kpi_id: string | null;
	deadline: string | null;
	first_action_48h: string | null;
	first_action_done_at: string | null;
	status: 'not_started' | 'in_progress' | 'done' | 'late' | 'cancelled';
	created_at: string;
};

export type MntMaslowTest = {
	id: string;
	journey_id: string;
	answers: number[];
	scores: Record<string, number>;
	taken_at: string;
};

export type MntBusinessPlanVersion = {
	id: string;
	journey_id: string;
	version: number;
	label: string | null;
	content: Record<string, unknown>;
	created_at: string;
};

// ── Materiais / Relatórios / Lives ───────────────────────────────────────────
export type MntMaterial = {
	id: string;
	cohort_id: string | null;
	meeting_template_id: string | null;
	title: string;
	description: string | null;
	kind: 'photo' | 'video' | 'doc' | 'link';
	url: string;
	published: boolean;
	created_at: string;
};

export type Comparison = {
	from: ComparisonSide;
	to: ComparisonSide;
	deltas: Record<
		string,
		{
			from: number | null;
			to: number | null;
			delta: number | null;
			delta_pct: number | null;
		}
	>;
};

export type ComparisonSide = {
	ref: string;
	label: string;
	taken_at: string | null;
	metrics: Record<string, unknown>;
};

export type MntReport = {
	id: string;
	journey_id: string;
	kind: 'raiox_final' | 'comparator';
	params: Record<string, unknown>;
	payload: Record<string, unknown>;
	generated_at: string;
};

export type MntMaturityConfig = {
	id: string;
	program_key: string;
	version: number;
	formula: Record<string, unknown>;
	active: boolean;
	created_at: string;
};

export type LiveStatus = 'idle' | 'active' | 'ended' | 'vod_ready';

/**
 * De onde sai o vídeo da sala. `mux` é a transmissão própria (mentor no OBS,
 * player embutido); `external` é um link de Zoom/Meet/YouTube que o aluno abre
 * em outra aba — o caminho que existe enquanto a plataforma própria não está
 * contratada, já que sem as credenciais do Mux a API não deixa nem criar a sala.
 *
 * Numa sala `external` os campos `mux_playback_id`/`vod_playback_id` são sempre
 * nulos e não há token de playback para pedir.
 */
export type LiveSource = 'mux' | 'external';

export type MntLiveRoom = {
	id: string;
	cohort_id: string | null;
	title: string;
	description: string | null;
	scheduled_at: string | null;
	status: LiveStatus;
	source: LiveSource;
	/** Link da transmissão. Só em `source: 'external'`. */
	external_url: string | null;
	/** Link da gravação, colado pelo admin ao encerrar. Só em `external`. */
	recording_url: string | null;
	mux_playback_id: string | null;
	vod_playback_id: string | null;
	started_at: string | null;
	ended_at: string | null;
	created_at: string;
};

export type LivePlayback = {
	playback_id: string;
	token: string;
	kind: 'live' | 'vod';
	expires_in: number;
};

export type LiveCredentials = { rtmp_url: string; stream_key: string };

export type MntLiveChatMessage = {
	id: string;
	live_room_id: string;
	user_id: string;
	user_name: string | null;
	body: string;
	created_at: string;
};
