'use client';

// Dashboard "Minha Empresa 360°".
//
// Segue o desenho aprovado pelo time: resumo do período com KPIs de topo,
// prioridades, donut da jornada, próximas ações e evolução dos indicadores.
//
// Tudo é alimentado pelos dados que a API já expõe hoje. O desenho previa
// quatro KPIs financeiros fixos (Faturamento, Ticket Médio, Clientes Ativos,
// Margem Líquida) e um bloco de prioridades próprio; nenhum dos dois existe no
// contrato atual, então os cards mostram os KPIs reais da jornada e as
// prioridades saem das tarefas (que TÊM `priority`). O que falta na API para
// fechar 100% com o desenho está em docs/mentoria-360-design-system.md.

import { Badge } from '@upvox-dev/ui';
import {
	Activity,
	ArrowRight,
	BarChart3,
	BookOpen,
	Building2,
	CheckSquare,
	Compass,
	FileText,
	Link2,
	Target,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import { CompanyMapRadar } from '@/modules/mentoria/components/company-map-radar';
import {
	DonutProgress,
	ListRow,
	RowIndex,
	SectionCard,
	SegmentedControl,
	StatCard,
	StatLine,
} from '@/modules/mentoria/components/ui';
import {
	useCompanyMap,
	useJourneyTools,
	useKpiHistories,
	useKpis,
	useMentoriaBootstrap,
	useMyMaterials,
	useTasks,
} from '@/modules/mentoria/hooks';
import type {
	MentoriaBootstrap,
	MntKpi,
	MntKpiMeasurement,
	MntTask,
} from '@/modules/mentoria/types';
import {
	BTN_PRIMARY,
	EmptyState,
	fmtDate,
	MntHeader,
	MntSkeleton,
} from './_components/shared';

export default function MentoriaHomePage() {
	return (
		<SubscriptionGate toolKey="mentoria_360">
			<HomeContent />
		</SubscriptionGate>
	);
}

function HomeContent() {
	const { data, isLoading } = useMentoriaBootstrap();

	if (isLoading) return <MntSkeleton />;

	if (!data?.journey) {
		return (
			<div className="max-w-3xl">
				<MntHeader
					title="Mentoria 360°"
					subtitle="Profissão Laser 360° — sua empresa vista por inteiro"
					icon={Compass}
				/>
				<EmptyState
					title="Você ainda não está matriculado em uma turma de mentoria"
					description="Assim que sua matrícula for confirmada pela equipe, sua jornada de 10 encontros aparece aqui. Enquanto isso, adiante o cadastro da sua empresa."
				>
					{/* O formulário ficava aqui embaixo. Passou a ter rota própria em
					    Configurações, então o bloqueio virou o que já era: um convite
					    com um destino. O rótulo distingue criar de editar — não é a
					    mesma promessa para quem lê. */}
					<Link href="/course/mentoria/configuracoes" className={BTN_PRIMARY}>
						{data?.company ? 'Editar dados da empresa' : 'Cadastrar empresa'}
					</Link>
				</EmptyState>
			</div>
		);
	}

	return <Dashboard bootstrap={data} journeyId={data.journey.id} />;
}

// ── Período ──────────────────────────────────────────────────────────────────

type Period = '3m' | '6m' | '12m';

const PERIOD_OPTIONS: Array<{ value: Period; label: string }> = [
	{ value: '3m', label: '3m' },
	{ value: '6m', label: '6m' },
	{ value: '12m', label: '12m' },
];

const PERIOD_MONTHS: Record<Period, number> = { '3m': 3, '6m': 6, '12m': 12 };

// ── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({
	bootstrap,
	journeyId,
}: {
	bootstrap: MentoriaBootstrap;
	journeyId: string;
}) {
	const { company, cohort, progress } = bootstrap;
	const [period, setPeriod] = useState<Period>('12m');

	const { data: tasks } = useTasks(journeyId);
	const { data: kpis } = useKpis(journeyId);
	const { data: tools } = useJourneyTools(journeyId);
	const { data: map } = useCompanyMap(journeyId);
	const { data: materials } = useMyMaterials();

	// Os quatro cards de topo e as séries do gráfico saem dos mesmos KPIs.
	const topKpis = useMemo(
		() => (kpis ?? []).filter((k) => k.active).slice(0, 4),
		[kpis],
	);
	const histories = useKpiHistories(topKpis.map((k) => k.id));

	const taskList = useMemo(() => tasks ?? [], [tasks]);
	const openTasks = useMemo(
		() =>
			taskList.filter(
				(t) =>
					t.status === 'pending' ||
					t.status === 'in_progress' ||
					t.status === 'overdue',
			),
		[taskList],
	);

	// "Prioridades Atuais": tarefas abertas de maior prioridade. O desenho tinha
	// um bloco próprio, mas prioridade só existe em tarefa no contrato atual.
	const priorities = useMemo(
		() =>
			[...openTasks]
				.sort(
					(a, b) =>
						PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] ||
						compareDueDate(a, b),
				)
				.slice(0, 3),
		[openTasks],
	);

	// "Próximas Ações": as mesmas tarefas, agora ordenadas por vencimento.
	const nextActions = useMemo(
		() => [...openTasks].sort(compareDueDate).slice(0, 3),
		[openTasks],
	);

	const toolList = tools ?? [];
	const kpiList = kpis ?? [];

	return (
		<div className="space-y-6">
			<MntHeader
				title={company?.name ?? 'Minha Empresa'}
				subtitle={
					cohort
						? `Visão geral de faturamento, clientes e margem — Turma ${cohort.name}`
						: 'Visão geral de faturamento, clientes e margem'
				}
				icon={Building2}
			/>

			{/* Resumo do período */}
			<SectionCard
				title="Resumo do período"
				description={`${currentMonthLabel()} — atualizado agora`}
				action={
					<SegmentedControl
						label="Período"
						value={period}
						options={PERIOD_OPTIONS}
						onChange={setPeriod}
					/>
				}
			>
				{topKpis.length === 0 ? (
					<p className="text-body text-muted py-6 text-center">
						Nenhum indicador cadastrado ainda.{' '}
						<Link
							href="/course/mentoria/indicadores"
							className="text-brand dark:text-violet-400 hover:underline"
						>
							Criar meu primeiro indicador
						</Link>
					</p>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
						{topKpis.map((kpi, i) => (
							<StatCard
								key={kpi.id}
								label={kpi.name}
								value={formatKpiValue(kpi.latest_measurement?.value, kpi.unit)}
								sub={
									kpi.target !== null
										? `Meta: ${formatKpiValue(kpi.target, kpi.unit)}`
										: kpi.latest_measurement
											? `Medido em ${fmtDate(kpi.latest_measurement.measured_at)}`
											: 'Sem medição'
								}
								icon={KPI_ICONS[i % KPI_ICONS.length]}
								tone={SEMAPHORE_TONE[kpi.current_semaphore ?? 'unmeasured']}
								delta={computeDelta(kpi, histories[i]?.data)}
								href="/course/mentoria/indicadores"
							/>
						))}
					</div>
				)}
			</SectionCard>

			{/* Prioridades + progresso da jornada */}
			<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6 items-start">
				<SectionCard title="Prioridades Atuais" bodyClassName="px-5 pb-5 pt-0">
					{priorities.length === 0 ? (
						<p className="text-body text-muted py-6 text-center">
							Nenhuma prioridade em aberto. Bom trabalho!
						</p>
					) : (
						<ul className="space-y-3">
							{priorities.map((task, i) => (
								<li key={task.id}>
									<ListRow
										boxed
										href="/course/mentoria/tarefas"
										leading={<RowIndex n={i + 1} />}
										title={task.title}
										description={task.description ?? undefined}
										trailing={
											<Badge tone={PRIORITY_TONE[task.priority]}>
												{PRIORITY_LABEL[task.priority]}
											</Badge>
										}
									/>
								</li>
							))}
						</ul>
					)}
				</SectionCard>

				<SectionCard title="Progresso da Jornada">
					<div className="flex flex-col items-center gap-5">
						<DonutProgress pct={progress.progress_pct} caption="Concluído" />
						<div className="w-full space-y-2">
							<StatLine
								label="Encontros"
								value={`${progress.meetings_done}/${progress.meetings_total}`}
							/>
							<StatLine
								label="Ferramentas"
								value={`${toolList.filter((t) => t.instance?.status === 'completed').length}/${toolList.length}`}
							/>
							<StatLine
								label="Tarefas"
								value={`${taskList.filter((t) => t.status === 'done').length}/${taskList.length}`}
							/>
							<StatLine
								label="Indicadores"
								value={`${kpiList.filter((k) => k.latest_measurement).length}/${kpiList.length}`}
							/>
						</div>
						<Link
							href="/course/mentoria/jornada"
							className="inline-flex items-center gap-1 text-body text-brand dark:text-violet-400 hover:underline"
						>
							Ver jornada <ArrowRight className="w-3.5 h-3.5" aria-hidden />
						</Link>
					</div>
				</SectionCard>
			</div>

			{/* Próximas ações + evolução dos indicadores */}
			<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-6 items-start">
				<SectionCard title="Próximas Ações" bodyClassName="px-5 pb-5 pt-0">
					{nextActions.length === 0 ? (
						<p className="text-body text-muted py-6 text-center">
							Nenhuma tarefa em aberto.
						</p>
					) : (
						<>
							<ul className="divide-y divide-subtle">
								{nextActions.map((task) => (
									<li key={task.id}>
										<ListRow
											title={task.title}
											trailing={
												<>
													<span className="text-caption text-muted tabular-nums">
														{fmtDate(task.due_date)}
													</span>
													<Badge tone={TASK_STATUS_TONE[task.status]}>
														{TASK_STATUS_LABEL[task.status]}
													</Badge>
												</>
											}
										/>
									</li>
								))}
							</ul>
							<Link
								href="/course/mentoria/tarefas"
								className="inline-block mt-3 text-body text-brand dark:text-violet-400 hover:underline"
							>
								Ver todas as tarefas
							</Link>
						</>
					)}
				</SectionCard>

				<SectionCard
					title="Evolução dos Principais Indicadores"
					action={
						<span className="text-caption text-muted">
							Últimos {PERIOD_MONTHS[period]} meses
						</span>
					}
				>
					<KpiEvolutionChart
						kpis={topKpis}
						histories={histories.map((h) => h.data)}
						months={PERIOD_MONTHS[period]}
					/>
				</SectionCard>
			</div>

			{/* Saúde das áreas + materiais */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
				<SectionCard
					title="Saúde das áreas"
					description="Maturidade da empresa por área (Mapa da Minha Empresa)"
				>
					{map && map.areas.length > 0 ? (
						<CompanyMapRadar map={map} />
					) : (
						<p className="text-body text-muted py-10 text-center">
							Comece a usar as ferramentas para ver o mapa da sua empresa.
						</p>
					)}
					<Link
						href="/course/mentoria/ferramentas"
						className="inline-flex items-center gap-1 text-body text-brand dark:text-violet-400 hover:underline"
					>
						Ver ferramentas <ArrowRight className="w-3.5 h-3.5" aria-hidden />
					</Link>
				</SectionCard>

				<SectionCard
					title="Materiais da mentoria"
					action={<BookOpen className="w-4 h-4 text-muted" aria-hidden />}
				>
					{(materials ?? []).length === 0 ? (
						<p className="text-body text-muted py-8 text-center">
							Nenhum material disponível ainda.
						</p>
					) : (
						<ul className="space-y-2">
							{(materials ?? []).slice(0, 8).map((mat) => (
								<li key={mat.id}>
									<a
										href={mat.url}
										target="_blank"
										rel="noreferrer"
										className="flex items-center gap-3 rounded-control border border-subtle px-3 py-2.5 hover:bg-surface-sunken transition-colors"
									>
										{mat.kind === 'link' ? (
											<Link2
												className="w-4 h-4 text-brand dark:text-violet-400 shrink-0"
												aria-hidden
											/>
										) : (
											<FileText
												className="w-4 h-4 text-brand dark:text-violet-400 shrink-0"
												aria-hidden
											/>
										)}
										<div className="min-w-0">
											<p className="text-body text-primary truncate">
												{mat.title}
											</p>
											{mat.description && (
												<p className="text-caption text-muted truncate">
													{mat.description}
												</p>
											)}
										</div>
									</a>
								</li>
							))}
						</ul>
					)}
				</SectionCard>
			</div>
		</div>
	);
}

// ── Gráfico de evolução ──────────────────────────────────────────────────────

// O recharts pinta com cor crua — `stroke` não aceita className —, então os
// valores dos tokens do DS aparecem literais aqui. É a mesma limitação que o
// próprio DS tem nas cores lidas por JS (spinner do Button, placeholder do
// Input). Registrado em docs/mentoria-360-design-system.md.
const SERIES_COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#dc2626'];

function KpiEvolutionChart({
	kpis,
	histories,
	months,
}: {
	kpis: MntKpi[];
	histories: Array<MntKpiMeasurement[] | undefined>;
	months: number;
}) {
	const { rows, series } = useMemo(
		() => buildSeries(kpis, histories, months),
		[kpis, histories, months],
	);

	if (series.length === 0 || rows.length === 0) {
		return (
			<p className="text-body text-muted py-12 text-center">
				Ainda não há medições suficientes para desenhar a evolução.
			</p>
		);
	}

	return (
		<>
			<div className="flex flex-wrap items-center gap-4 mb-3">
				{series.map((s, i) => (
					<span
						key={s.key}
						className="inline-flex items-center gap-1.5 text-caption text-secondary"
					>
						<span
							className="w-2 h-2 rounded-full"
							style={{
								backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length],
							}}
							aria-hidden
						/>
						{s.label}
					</span>
				))}
			</div>
			<ResponsiveContainer width="100%" height={220}>
				<LineChart
					data={rows}
					margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
				>
					<CartesianGrid
						strokeDasharray="4 4"
						stroke="currentColor"
						className="text-subtle"
						vertical={false}
					/>
					<XAxis
						dataKey="label"
						tickLine={false}
						axisLine={false}
						stroke="currentColor"
						className="text-muted"
						fontSize={12}
					/>
					<YAxis
						tickLine={false}
						axisLine={false}
						stroke="currentColor"
						className="text-muted"
						fontSize={12}
					/>
					<Tooltip
						contentStyle={{
							borderRadius: 12,
							border: '1px solid var(--color-subtle)',
							background: 'var(--color-surface)',
							color: 'var(--color-primary)',
							fontSize: 12,
						}}
					/>
					{series.map((s, i) => (
						<Line
							key={s.key}
							type="monotone"
							dataKey={s.key}
							name={s.label}
							stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
							strokeWidth={2}
							dot={false}
							connectNulls
						/>
					))}
				</LineChart>
			</ResponsiveContainer>
		</>
	);
}

/**
 * Achata N históricos em uma tabela mês × KPI, que é o formato que o recharts
 * consome. Meses sem medição ficam ausentes de propósito: `connectNulls` liga
 * os pontos em vez de desenhar um vale falso até o zero.
 */
function buildSeries(
	kpis: MntKpi[],
	histories: Array<MntKpiMeasurement[] | undefined>,
	months: number,
) {
	const cutoff = new Date();
	cutoff.setMonth(cutoff.getMonth() - months);

	const byMonth = new Map<string, Record<string, number | string>>();
	const series: Array<{ key: string; label: string }> = [];

	kpis.forEach((kpi, i) => {
		const measurements = histories[i];
		if (!measurements?.length) return;

		const key = `k${i}`;
		let used = false;

		for (const m of measurements) {
			if (m.value === null) continue;
			const at = new Date(m.measured_at);
			if (Number.isNaN(at.getTime()) || at < cutoff) continue;

			const monthKey = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}`;
			const row = byMonth.get(monthKey) ?? {
				monthKey,
				label: at.toLocaleDateString('pt-BR', { month: 'short' }),
			};
			// Mais de uma medição no mês: fica a mais recente.
			row[key] = m.value;
			byMonth.set(monthKey, row);
			used = true;
		}

		if (used) series.push({ key, label: kpi.name });
	});

	const rows = [...byMonth.values()].sort((a, b) =>
		String(a.monthKey).localeCompare(String(b.monthKey)),
	);

	return { rows, series };
}

// ── Formatação e mapas de rótulo ─────────────────────────────────────────────

const KPI_ICONS = [BarChart3, Target, Activity, CheckSquare];

const SEMAPHORE_TONE = {
	green: 'success',
	yellow: 'warning',
	red: 'danger',
	unmeasured: 'brand',
} as const;

const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 } as const;
const PRIORITY_LABEL = { high: 'Alta', medium: 'Média', low: 'Baixa' } as const;
const PRIORITY_TONE = {
	high: 'danger',
	medium: 'warning',
	low: 'neutral',
} as const;

const TASK_STATUS_LABEL: Record<MntTask['status'], string> = {
	pending: 'Pendente',
	in_progress: 'Em andamento',
	done: 'Concluída',
	overdue: 'Atrasada',
	cancelled: 'Cancelada',
};

const TASK_STATUS_TONE: Record<
	MntTask['status'],
	'neutral' | 'success' | 'warning' | 'danger' | 'brand'
> = {
	pending: 'neutral',
	in_progress: 'brand',
	done: 'success',
	overdue: 'danger',
	cancelled: 'neutral',
};

/** Tarefas sem prazo vão para o fim da fila, não para o começo. */
function compareDueDate(a: MntTask, b: MntTask) {
	if (!a.due_date && !b.due_date) return 0;
	if (!a.due_date) return 1;
	if (!b.due_date) return -1;
	return a.due_date.localeCompare(b.due_date);
}

function currentMonthLabel() {
	const label = new Date().toLocaleDateString('pt-BR', {
		month: 'long',
		year: 'numeric',
	});
	return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * A unidade do KPI é texto livre no contrato ("R$", "%", "un", "clientes"…),
 * então a formatação é por heurística e não por enum.
 */
function formatKpiValue(value: number | null | undefined, unit: string | null) {
	if (value === null || value === undefined) return '—';

	const u = (unit ?? '').trim().toLowerCase();

	if (u.includes('r$') || u.includes('reais') || u === 'brl') {
		return value.toLocaleString('pt-BR', {
			style: 'currency',
			currency: 'BRL',
			maximumFractionDigits: value >= 1000 ? 0 : 2,
		});
	}

	const formatted = value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
	if (u === '%' || u.includes('percent')) return `${formatted}%`;
	return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Variação entre as duas últimas medições.
 *
 * A cor não sai do sinal do número: um KPI de custo tem `direction:
 * 'down_good'`, e nele uma queda é a boa notícia.
 */
function computeDelta(kpi: MntKpi, history: MntKpiMeasurement[] | undefined) {
	if (!history || history.length < 2) return null;

	const measured = history
		.filter((m) => m.value !== null)
		.sort((a, b) => a.measured_at.localeCompare(b.measured_at));

	if (measured.length < 2) return null;

	const current = measured[measured.length - 1].value as number;
	const previous = measured[measured.length - 2].value as number;
	if (previous === 0) return null;

	return {
		pct: ((current - previous) / Math.abs(previous)) * 100,
		caption: 'vs medição anterior',
		upIsGood: kpi.direction === 'up_good',
	};
}
