'use client';

// Apresentação da Central de indicadores — só recebe os KPIs (com o histórico
// de cada um já carregado) e devolve os eventos. Quem busca e quem muta é o
// `page.tsx`.
//
// Todo o histórico (não só dos 4 do gráfico) chega pronto em `historyByKpiId`:
// é o que permite trocar de categoria, selecionar outro KPI para ver o
// histórico, ou abrir o formulário de medição sem depender de mais nenhum
// hook de rede aqui dentro. Com a vista pura, a rota de conferência
// (`app/(dev)/mentoria-indicadores-check`) monta os estados com fixtures —
// mesmo padrão de `desenvolvimento-view.tsx` e `diagnostico-view.tsx`.

import { Button, buttonLabel, Table } from '@upvox-dev/ui';
import { BarChart3, LineChart as LineChartIcon, Plus } from 'lucide-react';
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
import { toast } from 'sonner';
import {
	computeDelta,
	formatKpiValue,
	KpiEvolutionChart,
	SEMAPHORE_TONE,
} from '@/modules/mentoria/components/kpi-evolution';
import { SemaphoreBadge } from '@/modules/mentoria/components/semaphore-badge';
import {
	SectionCard,
	SegmentedControl,
	StatCard,
} from '@/modules/mentoria/components/ui';
import type { MntKpi, MntKpiMeasurement } from '@/modules/mentoria/types';
import {
	CARD,
	EmptyState,
	fmtDate,
	INPUT,
	LABEL,
	MntHeader,
} from '../../_components/shared';

const CATEGORY_LABEL: Record<string, string> = {
	comercial: 'Comercial',
	financeiro: 'Financeiro',
	producao: 'Produção',
	funnel: 'Funil comercial',
	geral: 'Geral',
};

type Period = '3m' | '6m' | '12m';

const PERIOD_OPTIONS: Array<{ value: Period; label: string }> = [
	{ value: '3m', label: '3m' },
	{ value: '6m', label: '6m' },
	{ value: '12m', label: '12m' },
];

const PERIOD_MONTHS: Record<Period, number> = { '3m': 3, '6m': 6, '12m': 12 };

export type NewKpiBody = Record<string, unknown> & { name: string };
export type NewMeasurementBody = {
	value: number | null;
	measured_at: string;
	note?: string | null;
};

export function IndicadoresView({
	kpis,
	historyByKpiId,
	creating,
	onCreateKpi,
	addingMeasurement,
	onAddMeasurement,
}: {
	kpis: MntKpi[];
	historyByKpiId: Record<string, MntKpiMeasurement[] | undefined>;
	creating: boolean;
	onCreateKpi: (body: NewKpiBody, opts: { onSuccess: () => void }) => void;
	addingMeasurement: boolean;
	onAddMeasurement: (
		kpiId: string,
		body: NewMeasurementBody,
		opts: { onSuccess: () => void },
	) => void;
}) {
	const [showForm, setShowForm] = useState(false);
	const [measuring, setMeasuring] = useState<MntKpi | null>(null);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [category, setCategory] = useState<string>('all');
	const [period, setPeriod] = useState<Period>('6m');
	const [form, setForm] = useState({
		name: '',
		category: 'geral',
		unit: '',
		target: '',
		direction: 'up_good',
		periodicity: 'monthly',
		green_pct: '100',
		yellow_pct: '70',
	});
	const [measurement, setMeasurement] = useState({
		value: '',
		measured_at: new Date().toISOString().slice(0, 10),
		note: '',
	});

	const categoriesPresent = useMemo(() => {
		const set = new Set(kpis.map((k) => k.category));
		return [...set];
	}, [kpis]);

	const visibleKpis = useMemo(() => {
		return category === 'all'
			? kpis
			: kpis.filter((k) => k.category === category);
	}, [kpis, category]);

	const chartKpis = useMemo(() => visibleKpis.slice(0, 4), [visibleKpis]);
	const chartHistories = chartKpis.map((k) => historyByKpiId[k.id]);

	const selected = kpis.find((k) => k.id === selectedId) ?? null;

	const submitKpi = () => {
		if (!form.name.trim()) {
			toast.error('Dê um nome ao indicador.');
			return;
		}
		onCreateKpi(
			{
				name: form.name,
				category: form.category,
				unit: form.unit || null,
				target: form.target === '' ? null : Number(form.target),
				direction: form.direction,
				periodicity: form.periodicity,
				semaphore: {
					green_pct: Number(form.green_pct),
					yellow_pct: Number(form.yellow_pct),
				},
			},
			{
				onSuccess: () => {
					setShowForm(false);
					setForm({ ...form, name: '', unit: '', target: '' });
				},
			},
		);
	};

	const submitMeasurement = () => {
		if (!measuring) return;
		onAddMeasurement(
			measuring.id,
			{
				value: measurement.value === '' ? null : Number(measurement.value),
				measured_at: measurement.measured_at,
				note: measurement.note || null,
			},
			{
				onSuccess: () => {
					setMeasuring(null);
					setMeasurement({ ...measurement, value: '', note: '' });
				},
			},
		);
	};

	return (
		<div className="p-4 md:p-8 max-w-5xl mx-auto">
			<MntHeader
				title="Central de indicadores"
				subtitle="KPIs com semáforo e histórico — medir é o primeiro passo"
				icon={BarChart3}
				backHref="/course/mentoria"
				actions={
					<Button variant="primary" onPress={() => setShowForm((v) => !v)}>
						<Plus className="w-4 h-4" aria-hidden />
						<span className={buttonLabel({ variant: 'primary' })}>
							Novo KPI
						</span>
					</Button>
				}
			/>

			{showForm && (
				<div
					className={`${CARD} p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4`}
				>
					<div className="md:col-span-2">
						<span className={LABEL}>Nome</span>
						<input
							className={INPUT}
							value={form.name}
							onChange={(e) => setForm({ ...form, name: e.target.value })}
							placeholder="Ex.: Faturamento, Leads, Conversão..."
						/>
					</div>
					<div>
						<span className={LABEL}>Categoria</span>
						<select
							className={INPUT}
							value={form.category}
							onChange={(e) => setForm({ ...form, category: e.target.value })}
						>
							{Object.entries(CATEGORY_LABEL).map(([value, label]) => (
								<option key={value} value={value}>
									{label}
								</option>
							))}
						</select>
					</div>
					<div>
						<span className={LABEL}>Unidade</span>
						<input
							className={INPUT}
							value={form.unit}
							onChange={(e) => setForm({ ...form, unit: e.target.value })}
							placeholder="R$, %, un..."
						/>
					</div>
					<div>
						<span className={LABEL}>Meta</span>
						<input
							type="number"
							className={INPUT}
							value={form.target}
							onChange={(e) => setForm({ ...form, target: e.target.value })}
						/>
					</div>
					<div>
						<span className={LABEL}>Direção</span>
						<select
							className={INPUT}
							value={form.direction}
							onChange={(e) => setForm({ ...form, direction: e.target.value })}
						>
							<option value="up_good">Quanto maior, melhor</option>
							<option value="down_good">Quanto menor, melhor</option>
						</select>
					</div>
					<div>
						<span className={LABEL}>Periodicidade</span>
						<select
							className={INPUT}
							value={form.periodicity}
							onChange={(e) =>
								setForm({ ...form, periodicity: e.target.value })
							}
						>
							<option value="daily">Diária</option>
							<option value="weekly">Semanal</option>
							<option value="monthly">Mensal</option>
						</select>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<span className={LABEL}>🟢 a partir de (% da meta)</span>
							<input
								type="number"
								className={INPUT}
								value={form.green_pct}
								onChange={(e) =>
									setForm({ ...form, green_pct: e.target.value })
								}
							/>
						</div>
						<div>
							<span className={LABEL}>🟡 a partir de (%)</span>
							<input
								type="number"
								className={INPUT}
								value={form.yellow_pct}
								onChange={(e) =>
									setForm({ ...form, yellow_pct: e.target.value })
								}
							/>
						</div>
					</div>
					<div className="md:col-span-2">
						<Button variant="primary" onPress={submitKpi} disabled={creating}>
							Criar indicador
						</Button>
					</div>
				</div>
			)}

			{kpis.length === 0 ? (
				<EmptyState
					icon={BarChart3}
					title="Nenhum indicador ainda"
					description="Crie seus primeiros KPIs — comercial (leads, vendas, conversão), financeiro (faturamento, margem) e produção."
				/>
			) : (
				<div className="space-y-6">
					<SegmentedControl
						label="Categoria"
						value={category}
						onChange={setCategory}
						options={[
							{ value: 'all', label: 'Todas' },
							...categoriesPresent.map((c) => ({
								value: c,
								label: CATEGORY_LABEL[c] ?? c,
							})),
						]}
					/>

					{visibleKpis.length > 0 && (
						<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
							{chartKpis.map((kpi, i) => (
								<StatCard
									key={kpi.id}
									label={kpi.name}
									value={formatKpiValue(
										kpi.latest_measurement?.value,
										kpi.unit,
									)}
									sub={
										kpi.target !== null
											? `Meta: ${formatKpiValue(kpi.target, kpi.unit)}`
											: kpi.latest_measurement
												? `Medido em ${fmtDate(kpi.latest_measurement.measured_at)}`
												: 'Sem medição'
									}
									tone={SEMAPHORE_TONE[kpi.current_semaphore ?? 'unmeasured']}
									delta={computeDelta(kpi, chartHistories[i])}
								/>
							))}
						</div>
					)}

					<SectionCard title="Indicadores" bodyClassName="p-0">
						<Table
							rows={visibleKpis}
							keyExtractor={(kpi) => kpi.id}
							emptyMessage="Nenhum indicador nesta categoria."
							columns={[
								{
									header: 'Indicador',
									align: 'left',
									flex: 2,
									cell: (kpi) => (
										<div>
											<p className="text-body text-primary">{kpi.name}</p>
											<p className="text-caption text-muted">
												{CATEGORY_LABEL[kpi.category] ?? kpi.category}
											</p>
										</div>
									),
								},
								{
									header: 'Atual',
									cell: (kpi) =>
										formatKpiValue(kpi.latest_measurement?.value, kpi.unit),
								},
								{
									header: 'Meta',
									cell: (kpi) => formatKpiValue(kpi.target, kpi.unit),
								},
								{
									header: 'Status',
									cell: (kpi) => (
										<div className="flex flex-col items-center gap-1.5">
											<SemaphoreBadge
												value={kpi.current_semaphore ?? 'unmeasured'}
											/>
											<ProgressBar
												pct={targetProgressPct(kpi)}
												tone={
													SEMAPHORE_TONE[kpi.current_semaphore ?? 'unmeasured']
												}
											/>
										</div>
									),
								},
								{
									header: '',
									flex: 1.4,
									cell: (kpi) => (
										<div className="flex items-center gap-2">
											<Button
												variant="secondary"
												onPress={() => setSelectedId(kpi.id)}
												accessibilityLabel={`Ver histórico de ${kpi.name}`}
											>
												<LineChartIcon className="w-4 h-4" aria-hidden />
											</Button>
											<Button
												variant="primary"
												onPress={() => setMeasuring(kpi)}
											>
												Medir
											</Button>
										</div>
									),
								},
							]}
						/>
					</SectionCard>

					{selected && (
						<SectionCard
							title={`Histórico — ${selected.name}`}
							description="Medições registradas para este indicador"
						>
							<KpiHistoryChart history={historyByKpiId[selected.id]} />
						</SectionCard>
					)}

					<SectionCard
						title="Evolução dos indicadores"
						action={
							<SegmentedControl
								label="Período"
								value={period}
								options={PERIOD_OPTIONS}
								onChange={setPeriod}
							/>
						}
					>
						<KpiEvolutionChart
							kpis={chartKpis}
							histories={chartHistories}
							months={PERIOD_MONTHS[period]}
						/>
					</SectionCard>
				</div>
			)}

			{/* Modal de medição */}
			{measuring && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<button
						type="button"
						aria-label="Fechar"
						className="absolute inset-0 bg-black/50"
						onClick={() => setMeasuring(null)}
					/>
					<div
						className={`${CARD} relative w-full max-w-md p-5 space-y-4 bg-white dark:bg-[#101114]`}
					>
						<h3 className="font-semibold text-slate-900 dark:text-slate-100">
							Medir: {measuring.name}
						</h3>
						<div>
							<span className={LABEL}>
								Valor {measuring.unit ? `(${measuring.unit})` : ''} — deixe
								vazio para "não medido"
							</span>
							<input
								type="number"
								className={INPUT}
								value={measurement.value}
								onChange={(e) =>
									setMeasurement({ ...measurement, value: e.target.value })
								}
							/>
						</div>
						<div>
							<span className={LABEL}>Data da medição</span>
							<input
								type="date"
								className={INPUT}
								value={measurement.measured_at}
								onChange={(e) =>
									setMeasurement({
										...measurement,
										measured_at: e.target.value,
									})
								}
							/>
						</div>
						<div>
							<span className={LABEL}>Nota (opcional)</span>
							<input
								className={INPUT}
								value={measurement.note}
								onChange={(e) =>
									setMeasurement({ ...measurement, note: e.target.value })
								}
							/>
						</div>
						<div className="flex gap-2 justify-end">
							<Button variant="secondary" onPress={() => setMeasuring(null)}>
								Cancelar
							</Button>
							<Button
								variant="primary"
								onPress={submitMeasurement}
								disabled={addingMeasurement}
							>
								Registrar medição
							</Button>
						</div>
						<p className="text-[11px] text-slate-400">
							Medições nunca são apagadas — correção entra como nova medição
							(histórico é o coração da mentoria).
						</p>
					</div>
				</div>
			)}
		</div>
	);
}

/** % da meta atingida pela última medição, para a barra de progresso da tabela. */
function targetProgressPct(kpi: MntKpi) {
	const value = kpi.latest_measurement?.value;
	if (value === null || value === undefined || !kpi.target) return null;
	return Math.max(0, Math.min(100, (value / kpi.target) * 100));
}

const PROGRESS_TONE_CLASS: Record<string, string> = {
	success: 'bg-emerald-500',
	warning: 'bg-amber-500',
	danger: 'bg-red-500',
	brand: 'bg-violet-500',
};

function ProgressBar({ pct, tone }: { pct: number | null; tone: string }) {
	if (pct === null) return null;
	return (
		<div className="w-20 h-1.5 rounded-full bg-surface-sunken overflow-hidden">
			<div
				className={`h-full rounded-full ${PROGRESS_TONE_CLASS[tone] ?? 'bg-violet-500'}`}
				style={{ width: `${pct}%` }}
			/>
		</div>
	);
}

function KpiHistoryChart({
	history,
}: {
	history: MntKpiMeasurement[] | undefined;
}) {
	const points = (history ?? [])
		.filter((m) => m.value !== null)
		.map((m) => ({ date: fmtDate(m.measured_at), value: m.value }));

	if (points.length === 0) {
		return (
			<p className="text-sm text-slate-400">Nenhuma medição com valor ainda.</p>
		);
	}

	return (
		<div className="h-48">
			<ResponsiveContainer width="100%" height="100%">
				<LineChart data={points}>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke="currentColor"
						className="text-slate-200 dark:text-white/10"
					/>
					<XAxis dataKey="date" tick={{ fontSize: 10 }} />
					<YAxis tick={{ fontSize: 10 }} width={44} />
					<Tooltip />
					<Line
						type="monotone"
						dataKey="value"
						stroke="#14b8a6"
						strokeWidth={2}
						dot={{ r: 3 }}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
