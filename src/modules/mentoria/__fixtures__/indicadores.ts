// Fixtures da Central de indicadores (KPIs).
//
// `useKpiHistories` busca o histórico de TODOS os KPIs de uma vez (ver
// `indicadores/page.tsx`), então aqui o histórico vem como um mapa por
// `kpi.id` — o mesmo formato que o container monta a partir das queries reais.
// As datas ficam nos últimos meses (o gráfico de evolução descarta medições
// fora do período selecionado), então ajuste-as se o fixture envelhecer.

import type { MntKpi, MntKpiMeasurement } from '../types';

const JOURNEY_ID = 'journey-fixture';

function measurement(
	id: string,
	kpiId: string,
	value: number | null,
	measuredAt: string,
	note: string | null = null,
): MntKpiMeasurement {
	return {
		id,
		kpi_id: kpiId,
		value,
		measured_at: measuredAt,
		note,
		created_at: `${measuredAt}T12:00:00.000Z`,
	};
}

// ── Estado 1 — sem indicadores ───────────────────────────────────────────────

export const kpisEmptyFixture: MntKpi[] = [];
export const kpiHistoryEmptyFixture: Record<string, MntKpiMeasurement[]> = {};

// ── Estado 2 — categorias e semáforos variados ──────────────────────────────

export const kpisListFixture: MntKpi[] = [
	{
		id: 'kpi-faturamento',
		journey_id: JOURNEY_ID,
		tool_instance_id: null,
		name: 'Faturamento',
		category: 'financeiro',
		unit: 'R$',
		target: 50000,
		direction: 'up_good',
		periodicity: 'monthly',
		owner_name: 'Maria',
		semaphore: { green_pct: 100, yellow_pct: 70 },
		active: true,
		latest_measurement: measurement(
			'm-fat-4',
			'kpi-faturamento',
			47500,
			'2026-08-31',
		),
		current_semaphore: 'yellow',
	},
	{
		id: 'kpi-leads',
		journey_id: JOURNEY_ID,
		tool_instance_id: null,
		name: 'Leads gerados',
		category: 'comercial',
		unit: 'un',
		target: 80,
		direction: 'up_good',
		periodicity: 'monthly',
		owner_name: null,
		semaphore: { green_pct: 100, yellow_pct: 70 },
		active: true,
		latest_measurement: measurement('m-leads-4', 'kpi-leads', 92, '2026-08-31'),
		current_semaphore: 'green',
	},
	{
		id: 'kpi-conversao',
		journey_id: JOURNEY_ID,
		tool_instance_id: null,
		name: 'Taxa de conversão',
		category: 'funnel',
		unit: '%',
		target: 25,
		direction: 'up_good',
		periodicity: 'monthly',
		owner_name: null,
		semaphore: { green_pct: 100, yellow_pct: 70 },
		active: true,
		latest_measurement: measurement(
			'm-conv-4',
			'kpi-conversao',
			11,
			'2026-08-31',
		),
		current_semaphore: 'red',
	},
	{
		id: 'kpi-custo-producao',
		journey_id: JOURNEY_ID,
		tool_instance_id: null,
		name: 'Custo de produção',
		category: 'producao',
		unit: 'R$',
		target: 12000,
		direction: 'down_good',
		periodicity: 'monthly',
		owner_name: null,
		semaphore: { green_pct: 100, yellow_pct: 85 },
		active: true,
		latest_measurement: measurement(
			'm-custo-3',
			'kpi-custo-producao',
			11200,
			'2026-08-15',
		),
		current_semaphore: 'green',
	},
	{
		id: 'kpi-nps',
		journey_id: JOURNEY_ID,
		tool_instance_id: null,
		name: 'NPS',
		category: 'geral',
		unit: null,
		target: null,
		direction: 'up_good',
		periodicity: 'monthly',
		owner_name: null,
		semaphore: { green_pct: 100, yellow_pct: 70 },
		active: true,
		latest_measurement: null,
		current_semaphore: 'unmeasured',
	},
];

export const kpiHistoryListFixture: Record<string, MntKpiMeasurement[]> = {
	'kpi-faturamento': [
		measurement('m-fat-1', 'kpi-faturamento', 38000, '2026-05-31'),
		measurement('m-fat-2', 'kpi-faturamento', 41200, '2026-06-30'),
		measurement('m-fat-3', 'kpi-faturamento', 44800, '2026-07-31'),
		measurement('m-fat-4', 'kpi-faturamento', 47500, '2026-08-31'),
	],
	'kpi-leads': [
		measurement('m-leads-1', 'kpi-leads', 61, '2026-05-31'),
		measurement('m-leads-2', 'kpi-leads', 70, '2026-06-30'),
		measurement('m-leads-3', 'kpi-leads', 85, '2026-07-31'),
		measurement('m-leads-4', 'kpi-leads', 92, '2026-08-31'),
	],
	'kpi-conversao': [
		measurement('m-conv-1', 'kpi-conversao', 22, '2026-05-31'),
		measurement('m-conv-2', 'kpi-conversao', 18, '2026-06-30'),
		measurement('m-conv-3', 'kpi-conversao', 14, '2026-07-31'),
		measurement('m-conv-4', 'kpi-conversao', 11, '2026-08-31'),
	],
	'kpi-custo-producao': [
		measurement('m-custo-1', 'kpi-custo-producao', 13500, '2026-06-15'),
		measurement('m-custo-2', 'kpi-custo-producao', 12100, '2026-07-15'),
		measurement('m-custo-3', 'kpi-custo-producao', 11200, '2026-08-15'),
	],
	'kpi-nps': [],
};

// ── Estado 3 — um único KPI, recém-criado e ainda sem medição ───────────────

export const kpisSingleUnmeasuredFixture: MntKpi[] = [
	{
		id: 'kpi-satisfacao',
		journey_id: JOURNEY_ID,
		tool_instance_id: null,
		name: 'Satisfação do cliente',
		category: 'geral',
		unit: '%',
		target: 90,
		direction: 'up_good',
		periodicity: 'monthly',
		owner_name: null,
		semaphore: { green_pct: 100, yellow_pct: 70 },
		active: true,
		latest_measurement: null,
		current_semaphore: 'unmeasured',
	},
];

export const kpiHistorySingleUnmeasuredFixture: Record<
	string,
	MntKpiMeasurement[]
> = {
	'kpi-satisfacao': [],
};
