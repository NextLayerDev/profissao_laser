// Fixtures da Evolução — os estados aqui dependem de tempo, não de cliques:
// comparar dois períodos exige uma Foto Zero enviada e meses de snapshots
// acumulados, e o Raio-X só sai depois que o backend consegue consolidar
// encontros, metas, indicadores e ferramentas. Ver deltas positivos, negativos
// e nulos na mesma tabela — ou um relatório vazio e um cheio lado a lado — não
// se reproduz numa jornada real sem esperar meses.

import type { Comparison, MntReport, MntSnapshot } from '../types';

const JOURNEY_ID = 'journey-fixture';

// ── Comparador ───────────────────────────────────────────────────────────────

/**
 * Deltas mistos: subida boa (faturamento), subida RUIM (custos fixos — é o
 * caso que a cor errada escondia antes do `upIsGood`), queda boa (custos não,
 * mas margem cai e é ruim), delta nulo e lado sem valor ("—").
 */
export const comparisonMixedFixture: Comparison = {
	from: {
		ref: 'foto_zero',
		label: 'Foto Zero',
		taken_at: '2026-01-15T12:00:00.000Z',
		metrics: {},
	},
	to: {
		ref: 'current',
		label: 'Agora',
		taken_at: '2026-09-01T12:00:00.000Z',
		metrics: {},
	},
	deltas: {
		faturamento: { from: 42000, to: 53200, delta: 11200, delta_pct: 26.7 },
		custos_fixos: { from: 18000, to: 21500, delta: 3500, delta_pct: 19.4 },
		margem: { from: 32, to: 28, delta: -4, delta_pct: -12.5 },
		ticket: { from: 850, to: 980, delta: 130, delta_pct: 15.3 },
		clientes: { from: 120, to: 120, delta: 0, delta_pct: 0 },
		recorrencia: { from: null, to: 34, delta: null, delta_pct: null },
		// Chave fora do METRIC_LABEL: cai no fallback e mostra a chave crua.
		satisfacao_nps: { from: 41, to: 62, delta: 21, delta_pct: 51.2 },
	},
};

/** Períodos válidos, mas sem nenhuma métrica numérica em comum. */
export const comparisonEmptyFixture: Comparison = {
	from: {
		ref: 'foto_zero',
		label: 'Foto Zero',
		taken_at: '2026-01-15T12:00:00.000Z',
		metrics: {},
	},
	to: {
		ref: 'current',
		label: 'Agora',
		taken_at: '2026-09-01T12:00:00.000Z',
		metrics: {},
	},
	deltas: {},
};

// ── Snapshots (opções do seletor de período) ─────────────────────────────────

function snapshot(
	id: string,
	overrides: Partial<MntSnapshot> = {},
): MntSnapshot {
	return {
		id,
		journey_id: JOURNEY_ID,
		kind: 'monthly',
		label: null,
		payload: {},
		metrics: {},
		taken_at: '2026-03-01T12:00:00.000Z',
		...overrides,
	};
}

/** Jornada recém-começada: só as duas âncoras (Foto Zero e Agora). */
export const snapshotsMinimalFixture: MntSnapshot[] = [];

/** Jornada com meio ano de histórico — o seletor fica longo. */
export const snapshotsManyFixture: MntSnapshot[] = [
	snapshot('snap-03', { label: 'Março', taken_at: '2026-03-01T12:00:00.000Z' }),
	snapshot('snap-04', { label: 'Abril', taken_at: '2026-04-01T12:00:00.000Z' }),
	snapshot('snap-05', { label: 'Maio', taken_at: '2026-05-01T12:00:00.000Z' }),
	snapshot('snap-06', { label: 'Junho', taken_at: '2026-06-01T12:00:00.000Z' }),
	// Sem `label`: cai no `kind`, que é o caso de snapshot criado automático.
	snapshot('snap-07', { label: null, taken_at: '2026-07-01T12:00:00.000Z' }),
	snapshot('snap-08', {
		label: 'Agosto',
		taken_at: '2026-08-01T12:00:00.000Z',
	}),
];

// ── Relatórios ───────────────────────────────────────────────────────────────

export const reportsEmptyFixture: MntReport[] = [];

/**
 * Dois relatórios: o Raio-X é gerado de novo a cada rodada da mentoria, então
 * a lista acumula — e é onde se vê o estado "aberto" de um deles.
 */
export const reportsListFixture: MntReport[] = [
	{
		id: 'report-full',
		journey_id: JOURNEY_ID,
		kind: 'raiox_final',
		params: {},
		payload: {},
		generated_at: '2026-09-01T12:00:00.000Z',
	},
	{
		id: 'report-old',
		journey_id: JOURNEY_ID,
		kind: 'raiox_final',
		params: {},
		payload: {},
		generated_at: '2026-05-10T12:00:00.000Z',
	},
];

// ── Raio-X ───────────────────────────────────────────────────────────────────

/**
 * Jornada no começo: o relatório sai com TODAS as listas vazias de uma vez —
 * cinco estados vazios, o score ausente e o fallback dos próximos 90 dias na
 * mesma tela. Numa jornada real isso só existe no primeiro dia.
 */
export const raioxEmptyFixture: MntReport = {
	id: 'report-empty',
	journey_id: JOURNEY_ID,
	kind: 'raiox_final',
	params: {},
	payload: {
		foto_zero: { taken_at: '2026-01-15T12:00:00.000Z', metrics: {} },
		tarefas: { total: 0, concluidas: 0 },
		pendencias: [],
		indicadores: [],
		ferramentas: [],
		encontros: [],
		metas: [],
		proximos_90_dias: null,
	},
	generated_at: '2026-01-16T12:00:00.000Z',
};

/**
 * Jornada no fim: 10/10 encontros, as 8 áreas do Mapa com maturidades
 * desiguais, indicadores nos quatro semáforos, pendências com e sem prazo,
 * score alto e um plano de 90 dias multi-linha. É o cenário usado para
 * conferir a folha impressa.
 */
export const raioxFullFixture: MntReport = {
	id: 'report-full',
	journey_id: JOURNEY_ID,
	kind: 'raiox_final',
	params: {},
	payload: {
		foto_zero: {
			taken_at: '2026-01-15T12:00:00.000Z',
			metrics: {
				faturamento: 42000,
				custos_fixos: 18000,
				margem: 32,
				ticket: 850,
				vendas: 49,
				clientes: 120,
				funcionarios: 3,
				recorrencia: '',
				// Campo aninhado: o MetricGrid filtra objetos, senão o String(value)
				// imprimiria "[object Object]".
				endereco: { cidade: 'Curitiba', uf: 'PR' },
			},
		},
		tarefas: { total: 34, concluidas: 29 },
		pendencias: [
			{
				title: 'Fechar o POP de atendimento',
				status: 'in_progress',
				due_date: '2026-09-20T12:00:00.000Z',
			},
			{ title: 'Revisar tabela de preços', status: 'pending', due_date: null },
		],
		indicadores: [
			{
				name: 'Faturamento mensal',
				latest: 53200,
				target: 60000,
				semaphore: 'yellow',
			},
			{
				name: 'Margem de contribuição',
				latest: 28,
				target: 35,
				semaphore: 'red',
			},
			{
				name: 'Clientes recorrentes',
				latest: 34,
				target: 30,
				semaphore: 'green',
			},
			{ name: 'Retrabalho', latest: null, target: 2, semaphore: 'unmeasured' },
		],
		ferramentas: [
			{ area: 'estrategia', maturity_pct: 82 },
			{ area: 'processos', maturity_pct: 64 },
			{ area: 'pessoas', maturity_pct: 55 },
			{ area: 'indicadores', maturity_pct: 71 },
			{ area: 'financeiro', maturity_pct: 48 },
			{ area: 'comercial', maturity_pct: 77 },
			{ area: 'melhoria', maturity_pct: 39 },
			{ area: 'pessoal', maturity_pct: 60 },
		],
		encontros: Array.from({ length: 10 }, (_, i) => ({
			position: i + 1,
			title: `Encontro ${i + 1}`,
			status: 'done',
		})),
		metas: [
			{ title: 'Chegar a R$ 60 mil de faturamento', status: 'in_progress' },
			{ title: 'Reduzir retrabalho para 2%', status: 'done' },
			{ title: 'Contratar um operador', status: 'pending' },
		],
		score_maturidade: 78,
		proximos_90_dias:
			'1. Fechar a contratação do operador até 30/10.\n2. Rodar o POP de atendimento com a equipe inteira.\n3. Subir a margem para 32% revisando a tabela de preços.',
	},
	generated_at: '2026-09-01T12:00:00.000Z',
};
