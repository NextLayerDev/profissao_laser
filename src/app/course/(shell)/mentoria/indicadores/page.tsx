'use client';

import { BarChart3, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useState } from 'react';
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
import { SubscriptionGate } from '@/components/course/subscription-gate';
import { SemaphoreBadge } from '@/modules/mentoria/components/semaphore-badge';
import {
	useKpiHistory,
	useKpiMutations,
	useKpis,
} from '@/modules/mentoria/hooks';
import type { MntKpi } from '@/modules/mentoria/types';
import {
	BTN_GHOST,
	BTN_PRIMARY,
	CARD,
	EmptyState,
	fmtDate,
	INPUT,
	JourneyGate,
	LABEL,
	MntHeader,
	MntSkeleton,
} from '../_components/shared';

const CATEGORY_LABEL: Record<string, string> = {
	comercial: 'Comercial',
	financeiro: 'Financeiro',
	producao: 'Produção',
	funnel: 'Funil comercial',
	geral: 'Geral',
};

export default function IndicadoresPage() {
	return (
		<SubscriptionGate toolKey="mentoria_360">
			<JourneyGate>
				{({ journeyId }) => <Content journeyId={journeyId} />}
			</JourneyGate>
		</SubscriptionGate>
	);
}

function Content({ journeyId }: { journeyId: string }) {
	const { data: kpis, isLoading } = useKpis(journeyId);
	const { create, addMeasurement } = useKpiMutations(journeyId);
	const [showForm, setShowForm] = useState(false);
	const [measuring, setMeasuring] = useState<MntKpi | null>(null);
	const [expanded, setExpanded] = useState<string | null>(null);
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

	if (isLoading) return <MntSkeleton />;

	const byCategory = new Map<string, MntKpi[]>();
	for (const kpi of kpis ?? []) {
		const list = byCategory.get(kpi.category) ?? [];
		list.push(kpi);
		byCategory.set(kpi.category, list);
	}

	const submitKpi = () => {
		if (!form.name.trim()) {
			toast.error('Dê um nome ao indicador.');
			return;
		}
		create.mutate(
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
					toast.success('Indicador criado!');
				},
				onError: () => toast.error('Não foi possível criar o indicador.'),
			},
		);
	};

	const submitMeasurement = () => {
		if (!measuring) return;
		addMeasurement.mutate(
			{
				kpiId: measuring.id,
				body: {
					value: measurement.value === '' ? null : Number(measurement.value),
					measured_at: measurement.measured_at,
					note: measurement.note || null,
				},
			},
			{
				onSuccess: () => {
					setMeasuring(null);
					setMeasurement({ ...measurement, value: '', note: '' });
					toast.success('Medição registrada!');
				},
				onError: () => toast.error('Não foi possível registrar a medição.'),
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
					<button
						type="button"
						onClick={() => setShowForm((v) => !v)}
						className={BTN_PRIMARY}
					>
						<Plus className="w-4 h-4" />
						Novo KPI
					</button>
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
						<button
							type="button"
							onClick={submitKpi}
							disabled={create.isPending}
							className={BTN_PRIMARY}
						>
							Criar indicador
						</button>
					</div>
				</div>
			)}

			{(kpis ?? []).length === 0 ? (
				<EmptyState
					icon={BarChart3}
					title="Nenhum indicador ainda"
					description="Crie seus primeiros KPIs — comercial (leads, vendas, conversão), financeiro (faturamento, margem) e produção."
				/>
			) : (
				<div className="space-y-8">
					{[...byCategory.entries()].map(([category, list]) => (
						<section key={category}>
							<h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-3">
								{CATEGORY_LABEL[category] ?? category}
							</h3>
							<div className="space-y-3">
								{list.map((kpi) => (
									<div key={kpi.id} className={`${CARD} p-4`}>
										<div className="flex flex-wrap items-center justify-between gap-3">
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2 flex-wrap">
													<p className="font-medium text-slate-900 dark:text-slate-100">
														{kpi.name}
													</p>
													<SemaphoreBadge
														value={kpi.current_semaphore ?? 'unmeasured'}
													/>
												</div>
												<p className="text-xs text-slate-400 mt-1">
													Última: {kpi.latest_measurement?.value ?? '—'}
													{kpi.unit ? ` ${kpi.unit}` : ''} (
													{fmtDate(kpi.latest_measurement?.measured_at)}) ·
													Meta: {kpi.target ?? '—'}
													{kpi.unit ? ` ${kpi.unit}` : ''}
												</p>
											</div>
											<div className="flex gap-2">
												<button
													type="button"
													onClick={() => setMeasuring(kpi)}
													className={BTN_PRIMARY}
												>
													Medir
												</button>
												<button
													type="button"
													onClick={() =>
														setExpanded(expanded === kpi.id ? null : kpi.id)
													}
													className={BTN_GHOST}
												>
													{expanded === kpi.id ? (
														<ChevronUp className="w-4 h-4" />
													) : (
														<ChevronDown className="w-4 h-4" />
													)}
												</button>
											</div>
										</div>
										{expanded === kpi.id && <KpiHistory kpiId={kpi.id} />}
									</div>
								))}
							</div>
						</section>
					))}
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
							<button
								type="button"
								onClick={() => setMeasuring(null)}
								className={BTN_GHOST}
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={submitMeasurement}
								disabled={addMeasurement.isPending}
								className={BTN_PRIMARY}
							>
								Registrar medição
							</button>
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

function KpiHistory({ kpiId }: { kpiId: string }) {
	const { data: history, isLoading } = useKpiHistory(kpiId);

	if (isLoading) {
		return (
			<div className="h-40 mt-4 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />
		);
	}
	const points = (history ?? [])
		.filter((m) => m.value !== null)
		.map((m) => ({ date: fmtDate(m.measured_at), value: m.value }));

	if (points.length === 0) {
		return (
			<p className="text-sm text-slate-400 mt-4">
				Nenhuma medição com valor ainda.
			</p>
		);
	}

	return (
		<div className="mt-4 h-48">
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
