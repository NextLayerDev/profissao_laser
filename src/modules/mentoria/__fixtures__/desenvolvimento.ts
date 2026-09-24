// Fixtures das 4 abas de Desenvolvimento pessoal (Boas Notícias, Meta e Ação,
// Maslow, Plano de Negócios).
//
// Cada aba busca seus próprios dados de forma independente e só monta ao ser
// selecionada — por isso os containers (`page.tsx`) continuam chamando os
// hooks, e só a apresentação virou vista pura (`desenvolvimento-view.tsx`).
// Estas fixtures existem para exercitar estados que dependem de sequência real
// (sequência de dias, metas em cada status, testes de Maslow repetidos,
// versões de plano de negócios) sem precisar reproduzi-los no backend.

import type {
	GoodNewsState,
	MntBusinessPlanVersion,
	MntFormTemplate,
	MntGoal,
	MntMaslowTest,
} from '../types';

const JOURNEY_ID = 'journey-fixture';

// ── Boas Notícias ────────────────────────────────────────────────────────────

/** Estado 1 — primeira visita: sem sequência, sem mural. */
export const goodNewsFreshFixture: GoodNewsState = {
	entries: [],
	current_streak: 0,
	longest_streak: 0,
	streak_goal: 7,
	posted_today: false,
};

/** Estado 2 — sequência em andamento, com mural de dias anteriores. */
export const goodNewsMidStreakFixture: GoodNewsState = {
	entries: [
		{
			id: 'good-news-1',
			journey_id: JOURNEY_ID,
			news: [
				'Fechei 3 orçamentos novos essa semana.',
				'Consegui organizar a agenda da máquina de laser.',
				'Um cliente antigo voltou a comprar.',
			],
			posted_on: '2026-08-31',
			created_at: '2026-08-31T09:00:00.000Z',
		},
		{
			id: 'good-news-2',
			journey_id: JOURNEY_ID,
			news: [
				'Terminei o cadastro dos produtos no catálogo.',
				'Recebi um elogio de um cliente no Instagram.',
				'Dormi bem essa semana toda.',
			],
			posted_on: '2026-09-01',
			created_at: '2026-09-01T08:30:00.000Z',
		},
	],
	current_streak: 4,
	longest_streak: 6,
	streak_goal: 7,
	posted_today: false,
};

/** Estado 3 — já postou hoje: o formulário fecha e mostra a confirmação. */
export const goodNewsPostedTodayFixture: GoodNewsState = {
	...goodNewsMidStreakFixture,
	current_streak: 7,
	longest_streak: 7,
	posted_today: true,
};

// ── Meta e Ação ──────────────────────────────────────────────────────────────

/** Estado 1 — nenhuma meta cadastrada. */
export const goalsEmptyFixture: MntGoal[] = [];

/** Estado 2 — metas em cada status, com e sem ação de 48h. */
export const goalsListFixture: MntGoal[] = [
	{
		id: 'goal-1',
		journey_id: JOURNEY_ID,
		title: 'Aumentar o faturamento mensal em 20% até o fim do trimestre.',
		indicator_text: 'Faturamento médio mensal no relatório financeiro.',
		kpi_id: null,
		deadline: '2026-11-30',
		first_action_48h:
			'Ligar para os 5 clientes que sumiram nos últimos 3 meses.',
		first_action_done_at: '2026-09-01T10:00:00.000Z',
		status: 'in_progress',
		created_at: '2026-08-20T12:00:00.000Z',
	},
	{
		id: 'goal-2',
		journey_id: JOURNEY_ID,
		title: 'Padronizar o atendimento de orçamento por WhatsApp.',
		indicator_text: 'Tempo médio de resposta abaixo de 2 horas.',
		kpi_id: null,
		deadline: '2026-09-15',
		first_action_48h: 'Escrever o roteiro de mensagens padrão.',
		first_action_done_at: null,
		status: 'late',
		created_at: '2026-08-10T12:00:00.000Z',
	},
	{
		id: 'goal-3',
		journey_id: JOURNEY_ID,
		title: 'Contratar um segundo operador para a máquina de laser.',
		indicator_text: null,
		kpi_id: null,
		deadline: null,
		first_action_48h: null,
		first_action_done_at: null,
		status: 'not_started',
		created_at: '2026-08-25T12:00:00.000Z',
	},
	{
		id: 'goal-4',
		journey_id: JOURNEY_ID,
		title: 'Fechar o mês sem atraso no pagamento dos fornecedores.',
		indicator_text: 'Extrato bancário do mês.',
		kpi_id: null,
		deadline: '2026-08-31',
		first_action_48h: 'Renegociar prazo com o fornecedor de insumos.',
		first_action_done_at: '2026-08-05T09:00:00.000Z',
		status: 'done',
		created_at: '2026-07-28T12:00:00.000Z',
	},
];

// ── Maslow ───────────────────────────────────────────────────────────────────

/** Estado 1 — nunca aplicado: o teste aparece direto, sem radar. */
export const maslowNoHistoryFixture: MntMaslowTest[] = [];

/** Estado 2 — aplicações anteriores: radar + dimensão mais baixa em destaque. */
export const maslowWithHistoryFixture: MntMaslowTest[] = [
	{
		id: 'maslow-1',
		journey_id: JOURNEY_ID,
		answers: Array.from({ length: 15 }, () => 2),
		scores: {
			fisiologia: 70,
			seguranca: 55,
			pertencimento: 80,
			estima: 65,
			autorrealizacao: 60,
		},
		taken_at: '2026-06-10T12:00:00.000Z',
	},
	{
		id: 'maslow-2',
		journey_id: JOURNEY_ID,
		answers: Array.from({ length: 15 }, () => 3),
		scores: {
			fisiologia: 85,
			seguranca: 45,
			pertencimento: 90,
			estima: 70,
			autorrealizacao: 75,
		},
		taken_at: '2026-08-20T12:00:00.000Z',
	},
] as const;

// ── Plano de Negócios ────────────────────────────────────────────────────────

const BUSINESS_PLAN_TEMPLATE_ID = 'template-plano-negocios-fixture';

export const businessPlanTemplateFixture: MntFormTemplate = {
	id: BUSINESS_PLAN_TEMPLATE_ID,
	key: 'plano_negocios',
	version: 1,
	title: 'Plano de Negócios',
	description:
		'Um retrato do seu negócio hoje — e de onde ele quer chegar. Cada envio vira uma versão nova, sem apagar as anteriores.',
	schema: {
		blocks: [
			{
				key: 'visao',
				title: 'Visão',
				fields: [
					{ key: 'missao', label: 'Missão do negócio', type: 'textarea' },
					{
						key: 'publico',
						label: 'Público-alvo principal',
						type: 'text',
					},
				],
			},
			{
				key: 'metas',
				title: 'Metas',
				fields: [
					{
						key: 'faturamento_alvo',
						label: 'Faturamento mensal desejado em 12 meses',
						type: 'currency',
					},
				],
			},
		],
	},
	published: true,
	created_at: '2026-01-05T12:00:00.000Z',
	updated_at: '2026-01-05T12:00:00.000Z',
};

/** Estado 1 — turma sem template de plano de negócios publicado. */
export const businessPlanNoTemplateFixture = {
	template: null as MntFormTemplate | null,
	versions: [] as MntBusinessPlanVersion[],
};

/** Estado 2 — template publicado, nenhuma versão enviada ainda. */
export const businessPlanEmptyFixture = {
	template: businessPlanTemplateFixture,
	versions: [] as MntBusinessPlanVersion[],
};

const businessPlanV1: MntBusinessPlanVersion = {
	id: 'plan-v1',
	journey_id: JOURNEY_ID,
	version: 1,
	label: null,
	content: {
		missao: 'Ser referência em gravação a laser na região.',
		publico: 'Pequenos comércios e autônomos que personalizam produtos.',
		faturamento_alvo: 25000,
	},
	created_at: '2026-02-01T12:00:00.000Z',
};

const businessPlanV2: MntBusinessPlanVersion = {
	id: 'plan-v2',
	journey_id: JOURNEY_ID,
	version: 2,
	label: 'Revisão pós-diagnóstico',
	content: {
		missao:
			'Ser referência em gravação a laser na região, com atendimento consultivo.',
		publico: 'Pequenos comércios, autônomos e pequenas indústrias locais.',
		faturamento_alvo: 40000,
	},
	created_at: '2026-08-15T12:00:00.000Z',
};

/** Estado 3 — múltiplas versões, incluindo uma em modo leitura. */
export const businessPlanListFixture = {
	template: businessPlanTemplateFixture,
	versions: [businessPlanV2, businessPlanV1] as MntBusinessPlanVersion[],
};
