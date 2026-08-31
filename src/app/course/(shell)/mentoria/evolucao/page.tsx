'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
	ArrowDownRight,
	ArrowUpRight,
	Camera,
	FileText,
	Printer,
	TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import {
	useComparison,
	useReports,
	useSnapshots,
} from '@/modules/mentoria/hooks';
import { createSnapshot, generateRaiox } from '@/modules/mentoria/service';
import type { MntReport } from '@/modules/mentoria/types';
import {
	apiErrorCode,
	BTN_GHOST,
	BTN_PRIMARY,
	CARD,
	fmtDate,
	INPUT,
	JourneyGate,
	LABEL,
	MntHeader,
	MntSkeleton,
} from '../_components/shared';

export default function EvolucaoPage() {
	return (
		<SubscriptionGate toolKey="mentoria_360">
			<JourneyGate>
				{({ journeyId }) => <Content journeyId={journeyId} />}
			</JourneyGate>
		</SubscriptionGate>
	);
}

const METRIC_LABEL: Record<string, string> = {
	faturamento: 'Faturamento',
	custos_fixos: 'Custos fixos',
	margem: 'Margem (%)',
	ticket: 'Ticket médio',
	vendas: 'Vendas/mês',
	clientes: 'Clientes',
	funcionarios: 'Funcionários',
	recorrencia: 'Clientes recorrentes (%)',
	maturidade_geral: 'Maturidade geral (%)',
};

function Content({ journeyId }: { journeyId: string }) {
	const qc = useQueryClient();
	const { data: snapshots, isLoading: loadingSnapshots } =
		useSnapshots(journeyId);
	const [from, setFrom] = useState('foto_zero');
	const [to, setTo] = useState('current');
	const {
		data: comparison,
		isLoading: loadingCompare,
		isError,
	} = useComparison(journeyId, from, to);
	const { data: reports } = useReports(journeyId);
	const [openReport, setOpenReport] = useState<MntReport | null>(null);

	const snapshot = useMutation({
		mutationFn: () => createSnapshot(journeyId, { kind: 'monthly' }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['mentoria', 'snapshots', journeyId] });
			toast.success('Snapshot congelado! Ele fica disponível no comparador.');
		},
		onError: () => toast.error('Não foi possível congelar o snapshot.'),
	});

	const raiox = useMutation({
		mutationFn: () => generateRaiox(journeyId),
		onSuccess: (report) => {
			qc.invalidateQueries({ queryKey: ['mentoria', 'reports', journeyId] });
			setOpenReport(report);
			toast.success('Raio-X Empresarial 360° gerado!');
		},
		onError: (e) =>
			toast.error(
				apiErrorCode(e) === 'foto_zero_missing'
					? 'Complete o diagnóstico inicial (Foto Zero) antes de gerar o relatório.'
					: 'Não foi possível gerar o relatório.',
			),
	});

	if (loadingSnapshots) return <MntSkeleton />;

	const options = [
		{ value: 'foto_zero', label: 'Foto Zero' },
		...(snapshots ?? [])
			.filter((s) => s.kind !== 'foto_zero')
			.map((s) => ({
				value: s.id,
				label: `${s.label ?? s.kind} — ${fmtDate(s.taken_at)}`,
			})),
		{ value: 'current', label: 'Agora' },
	];

	return (
		<div className="p-4 md:p-8 max-w-5xl mx-auto">
			<MntHeader
				title="Evolução da empresa"
				subtitle="Compare períodos e gere o Raio-X Empresarial 360°"
				icon={TrendingUp}
				backHref="/course/mentoria"
				actions={
					<button
						type="button"
						onClick={() => snapshot.mutate()}
						disabled={snapshot.isPending}
						className={BTN_GHOST}
					>
						<Camera className="w-4 h-4" />
						Congelar snapshot de agora
					</button>
				}
			/>

			{/* Comparador */}
			<div className={`${CARD} p-5 mb-8`}>
				<h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
					Comparar minha empresa
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
					<div>
						<span className={LABEL}>Período A</span>
						<select
							className={INPUT}
							value={from}
							onChange={(e) => setFrom(e.target.value)}
						>
							{options.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</select>
					</div>
					<div>
						<span className={LABEL}>Período B</span>
						<select
							className={INPUT}
							value={to}
							onChange={(e) => setTo(e.target.value)}
						>
							{options.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</select>
					</div>
				</div>

				{loadingCompare ? (
					<div className="h-40 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />
				) : isError || !comparison ? (
					<p className="text-sm text-slate-400">
						Não foi possível comparar esses períodos. Envie o diagnóstico (Foto
						Zero) primeiro.
					</p>
				) : Object.keys(comparison.deltas).length === 0 ? (
					<p className="text-sm text-slate-400">
						Sem métricas numéricas em comum entre os dois períodos ainda.
					</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="text-left text-xs text-slate-400 border-b border-slate-200 dark:border-white/10">
									<th className="py-2 pr-4">Métrica</th>
									<th className="py-2 pr-4">{comparison.from.label}</th>
									<th className="py-2 pr-4">{comparison.to.label}</th>
									<th className="py-2">Variação</th>
								</tr>
							</thead>
							<tbody>
								{Object.entries(comparison.deltas).map(([key, d]) => (
									<tr
										key={key}
										className="border-b border-slate-100 dark:border-white/5"
									>
										<td className="py-2.5 pr-4 font-medium text-slate-700 dark:text-slate-300">
											{METRIC_LABEL[key] ?? key}
										</td>
										<td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">
											{d.from ?? '—'}
										</td>
										<td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">
											{d.to ?? '—'}
										</td>
										<td className="py-2.5">
											{d.delta === null ? (
												<span className="text-slate-400">—</span>
											) : (
												<span
													className={`inline-flex items-center gap-1 ${
														d.delta >= 0
															? 'text-emerald-600 dark:text-emerald-400'
															: 'text-red-600 dark:text-red-400'
													}`}
												>
													{d.delta >= 0 ? (
														<ArrowUpRight className="w-3.5 h-3.5" />
													) : (
														<ArrowDownRight className="w-3.5 h-3.5" />
													)}
													{d.delta > 0 ? '+' : ''}
													{d.delta}
													{d.delta_pct !== null && ` (${d.delta_pct}%)`}
												</span>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Relatórios */}
			<div className={`${CARD} p-5`}>
				<div className="flex flex-wrap items-center justify-between gap-3 mb-4">
					<h3 className="font-semibold text-slate-900 dark:text-slate-100">
						Raio-X Empresarial 360°
					</h3>
					<button
						type="button"
						onClick={() => raiox.mutate()}
						disabled={raiox.isPending}
						className={BTN_PRIMARY}
					>
						<FileText className="w-4 h-4" />
						{raiox.isPending ? 'Gerando...' : 'Gerar Raio-X 360°'}
					</button>
				</div>
				{(reports ?? []).length === 0 ? (
					<p className="text-sm text-slate-400">
						Nenhum relatório gerado ainda. O Raio-X consolida: onde comecei, o
						que diagnosticamos, o que planejamos, o que foi executado,
						resultados, pendências, evolução e os próximos 90 dias.
					</p>
				) : (
					<div className="space-y-2">
						{(reports ?? []).map((report) => (
							<button
								key={report.id}
								type="button"
								onClick={() =>
									setOpenReport(openReport?.id === report.id ? null : report)
								}
								className="w-full text-left rounded-xl border border-slate-200 dark:border-white/10 px-4 py-3 hover:border-teal-500/40 transition text-sm text-slate-700 dark:text-slate-300"
							>
								Raio-X Empresarial — gerado em {fmtDate(report.generated_at)}
							</button>
						))}
					</div>
				)}
			</div>

			{openReport && <RaioxView report={openReport} />}
		</div>
	);
}

function RaioxView({ report }: { report: MntReport }) {
	const p = report.payload as Record<string, unknown>;
	const fotoZero = p.foto_zero as
		| { taken_at?: string; metrics?: Record<string, unknown> }
		| undefined;
	const tarefas = p.tarefas as { total?: number; concluidas?: number } | null;
	const pendencias = (p.pendencias ?? []) as Array<{
		title: string;
		status: string;
		due_date: string | null;
	}>;
	const indicadores = (p.indicadores ?? []) as Array<{
		name: string;
		latest: number | null;
		target: number | null;
		semaphore: string;
	}>;
	const ferramentas = (p.ferramentas ?? []) as Array<{
		area: string;
		maturity_pct: number;
	}>;
	const encontros = (p.encontros ?? []) as Array<{
		position: number;
		title: string | null;
		status: string;
	}>;
	const metas = (p.metas ?? []) as Array<{ title: string; status: string }>;
	const score = p.score_maturidade as number | undefined;
	const proximos = p.proximos_90_dias as string | null;

	return (
		<div className={`${CARD} p-6 mt-6 print:border-0 print:shadow-none`}>
			<div className="flex items-center justify-between mb-6 print:hidden">
				<h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
					RAIO-X EMPRESARIAL — Profissão Laser 360°
				</h3>
				<button
					type="button"
					onClick={() => window.print()}
					className={BTN_GHOST}
				>
					<Printer className="w-4 h-4" />
					Imprimir
				</button>
			</div>

			<div className="space-y-6 text-sm">
				<ReportSection title="1. Onde comecei (Foto Zero)">
					<p className="text-slate-500 mb-2">
						Registrada em {fmtDate(fotoZero?.taken_at ?? null)}
					</p>
					<MetricGrid metrics={fotoZero?.metrics ?? {}} />
				</ReportSection>

				<ReportSection title="2. O que diagnosticamos">
					<p className="text-slate-600 dark:text-slate-400">
						Diagnóstico completo registrado na Foto Zero (blocos identificação,
						estrutura, financeiro, comercial e diagnóstico).
					</p>
				</ReportSection>

				<ReportSection title="3. O que planejamos">
					{metas.length === 0 ? (
						<p className="text-slate-400">Nenhuma meta registrada.</p>
					) : (
						<ul className="space-y-1">
							{metas.map((m) => (
								<li
									key={m.title}
									className="text-slate-600 dark:text-slate-400"
								>
									• {m.title} <span className="text-xs">({m.status})</span>
								</li>
							))}
						</ul>
					)}
				</ReportSection>

				<ReportSection title="4. O que foi executado">
					<p className="text-slate-600 dark:text-slate-400 mb-2">
						Encontros concluídos:{' '}
						{encontros.filter((e) => e.status === 'done').length}/
						{encontros.length} · Tarefas: {tarefas?.concluidas ?? 0}/
						{tarefas?.total ?? 0} concluídas
					</p>
					<div className="flex flex-wrap gap-2">
						{ferramentas.map((f) => (
							<span
								key={f.area}
								className="text-xs rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2.5 py-1"
							>
								{f.area}: {f.maturity_pct}%
							</span>
						))}
					</div>
				</ReportSection>

				<ReportSection title="5. Resultados (indicadores)">
					{indicadores.length === 0 ? (
						<p className="text-slate-400">Nenhum indicador registrado.</p>
					) : (
						<ul className="space-y-1">
							{indicadores.map((k) => (
								<li key={k.name} className="text-slate-600 dark:text-slate-400">
									• {k.name}: {k.latest ?? '—'} (meta {k.target ?? '—'})
								</li>
							))}
						</ul>
					)}
				</ReportSection>

				<ReportSection title="6. Pendências">
					{pendencias.length === 0 ? (
						<p className="text-slate-400">Nenhuma pendência. 🎉</p>
					) : (
						<ul className="space-y-1">
							{pendencias.map((t) => (
								<li
									key={t.title}
									className="text-slate-600 dark:text-slate-400"
								>
									• {t.title}{' '}
									<span className="text-xs">
										({t.status}
										{t.due_date ? ` · prazo ${fmtDate(t.due_date)}` : ''})
									</span>
								</li>
							))}
						</ul>
					)}
				</ReportSection>

				<ReportSection title="7. Evolução">
					<p className="text-slate-600 dark:text-slate-400">
						Score de maturidade: <b>{score ?? '—'}/100</b>. Comparação completa
						disponível no comparador acima (Foto Zero vs Agora).
					</p>
				</ReportSection>

				<ReportSection title="8. Próximos 90 dias">
					<p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
						{proximos ??
							'Preencha a avaliação final do Encontro 10 para registrar o plano dos próximos 90 dias.'}
					</p>
				</ReportSection>
			</div>
		</div>
	);
}

function ReportSection({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section>
			<h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
				{title}
			</h4>
			{children}
		</section>
	);
}

function MetricGrid({ metrics }: { metrics: Record<string, unknown> }) {
	const entries = Object.entries(metrics).filter(
		([, v]) => typeof v !== 'object' || v === null,
	);
	if (entries.length === 0)
		return <p className="text-slate-400">Sem métricas registradas.</p>;
	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
			{entries.map(([key, value]) => (
				<div
					key={key}
					className="rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2"
				>
					<p className="text-[11px] text-slate-400">
						{METRIC_LABEL[key] ?? key}
					</p>
					<p className="font-semibold text-slate-900 dark:text-slate-100">
						{value === null || value === undefined || value === ''
							? '—'
							: String(value)}
					</p>
				</div>
			))}
		</div>
	);
}
