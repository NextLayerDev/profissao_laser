'use client';

import {
	CheckCircle2,
	ClipboardList,
	Layers,
	Paperclip,
	Radar as RadarIcon,
	RotateCcw,
	Target,
} from 'lucide-react';
import { toast } from 'sonner';
import {
	fmtMoney,
	linkLabel,
	normalizeUrl,
} from '@/app/course/(shell)/mentoria/_components/shared';
import {
	areaLabel,
	CompanyMapRadar,
	MaturityBasisBadge,
	ValidatedMark,
} from '@/modules/mentoria/components/company-map-radar';
import { SemaphoreBadge } from '@/modules/mentoria/components/semaphore-badge';
import type {
	CompanyMap,
	MentorToolContent,
	MntFinancialEntry,
	MntKpi,
	MntOrgPosition,
} from '@/modules/mentoria/types';
import {
	mentoriaErrorMessage,
	useMentorCompanyMap,
	useMentorDiagnostic,
	useMentorJourneyKpis,
	useMentorSubmissions,
	useMentorToolContent,
	useMentorToolValidation,
} from '../../../_components/admin-hooks';
import {
	Badge,
	Card,
	formatDate,
	ProgressBar,
	primaryBtn,
	secondaryBtn,
} from '../../../_components/ui';
import {
	diagnosticLabels,
	formatKpiValue,
	QueryState,
	SectionTitle,
	SubmissionCard,
} from './common';

export function ToolsTab({ journeyId }: { journeyId: string }) {
	const companyMap = useMentorCompanyMap(journeyId);
	const kpis = useMentorJourneyKpis(journeyId);
	const content = useMentorToolContent(journeyId);
	const submissions = useMentorSubmissions(journeyId);
	const diagnostic = useMentorDiagnostic(journeyId);
	const labels = diagnosticLabels(diagnostic.data);

	return (
		<div className="space-y-10">
			<section>
				<SectionTitle icon={RadarIcon}>Mapa da empresa</SectionTitle>
				<QueryState
					loading={companyMap.isLoading}
					error={companyMap.isError}
					empty={!companyMap.data}
					errorText="Não foi possível carregar o mapa."
					emptyText="Mapa indisponível."
				>
					{companyMap.data && (
						<Card className="p-5 space-y-6">
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
								<CompanyMapRadar map={companyMap.data} />
								<div>
									<div className="flex flex-wrap items-center gap-2 mb-3">
										<p className="text-sm text-muted">
											Maturidade geral:{' '}
											<span className="font-semibold text-primary">
												{Math.round(companyMap.data.overall_pct)}%
											</span>
										</p>
										<MaturityBasisBadge map={companyMap.data} />
									</div>
									<ul className="space-y-2">
										{companyMap.data.areas.map((a) => (
											<li
												key={a.area}
												className="flex items-center gap-3 text-sm"
											>
												<span className="w-28 text-muted">
													{areaLabel(a.area)}
												</span>
												<div className="flex-1">
													<ProgressBar pct={a.maturity_pct} />
												</div>
											</li>
										))}
									</ul>
								</div>
							</div>
							<ToolValidationList journeyId={journeyId} map={companyMap.data} />
						</Card>
					)}
				</QueryState>
			</section>

			<section>
				<SectionTitle icon={Target}>Indicadores (KPIs)</SectionTitle>
				<QueryState
					loading={kpis.isLoading}
					error={kpis.isError}
					empty={!kpis.data?.length}
					errorText="Não foi possível carregar os indicadores."
					emptyText="Nenhum indicador."
				>
					<KpiTable kpis={kpis.data ?? []} />
				</QueryState>
			</section>

			<section>
				<SectionTitle icon={Layers}>O que o aluno montou</SectionTitle>
				<QueryState
					loading={content.isLoading}
					error={content.isError}
					empty={!content.data || isEmptyContent(content.data)}
					errorText="Não foi possível carregar as ferramentas."
					emptyText="Nada preenchido ainda."
				>
					{content.data && <ToolContent content={content.data} />}
				</QueryState>
			</section>

			<section>
				<SectionTitle icon={ClipboardList}>
					Formulários respondidos
				</SectionTitle>
				<QueryState
					loading={submissions.isLoading}
					error={submissions.isError}
					empty={!submissions.data?.length}
					errorText="Não foi possível carregar os formulários."
					emptyText="Nenhum formulário respondido."
				>
					<div className="space-y-3">
						{submissions.data?.map((s) => (
							<SubmissionCard
								key={s.id}
								submission={s}
								labels={
									s.form_template_id === diagnostic.data?.template?.id
										? labels
										: undefined
								}
							/>
						))}
					</div>
				</QueryState>
			</section>
		</div>
	);
}

function KpiTable({ kpis }: { kpis: MntKpi[] }) {
	return (
		<Card>
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="text-left text-xs uppercase tracking-wide text-muted border-b border-subtle">
							<th className="px-5 py-3 font-medium">Indicador</th>
							<th className="px-5 py-3 font-medium">Meta</th>
							<th className="px-5 py-3 font-medium">Última medição</th>
							<th className="px-5 py-3 font-medium">Semáforo</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100 dark:divide-white/5">
						{kpis.map((k) => (
							<tr key={k.id}>
								<td className="px-5 py-3">
									<p className="font-medium text-primary">{k.name}</p>
									<p className="text-xs text-muted">
										{k.category}
										{k.owner_name ? ` · ${k.owner_name}` : ''}
									</p>
								</td>
								<td className="px-5 py-3 text-muted">
									{formatKpiValue(k.target, k.unit)}
								</td>
								<td className="px-5 py-3 text-muted">
									{k.latest_measurement
										? `${formatKpiValue(k.latest_measurement.value, k.unit)} (${formatDate(k.latest_measurement.measured_at)})`
										: '—'}
								</td>
								<td className="px-5 py-3">
									<SemaphoreBadge value={k.current_semaphore ?? 'unmeasured'} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Card>
	);
}

function isEmptyContent(c: MentorToolContent): boolean {
	return (
		!c.process_flows.length &&
		!c.org_positions.length &&
		!c.pops.length &&
		!c.financial_entries.length &&
		!c.funnel_stages.length &&
		!c.improvements.length
	);
}

function Block({
	title,
	children,
	testId,
}: {
	title: string;
	children: React.ReactNode;
	testId: string;
}) {
	return (
		<div data-testid={testId}>
			<Card className="p-4 h-full">
				<h4 className="text-label text-primary mb-3">{title}</h4>
				{children}
			</Card>
		</div>
	);
}

/** Leitura compacta do que o aluno preencheu em cada ferramenta. */
function ToolContent({ content }: { content: MentorToolContent }) {
	const months = latestPerMonth(content.financial_entries);
	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
			{content.process_flows.length > 0 && (
				<Block title="Fluxograma de processos" testId="mentor-flows">
					<div className="space-y-3">
						{content.process_flows.map((f) => (
							<div key={f.id}>
								<p className="text-sm font-medium text-primary">{f.name}</p>
								<ol className="mt-1 list-decimal pl-5 text-sm text-muted space-y-0.5">
									{f.steps.map((s) => (
										<li key={s.id}>
											{s.name}
											{s.owner_name ? ` · ${s.owner_name}` : ''}
										</li>
									))}
								</ol>
							</div>
						))}
					</div>
				</Block>
			)}

			{content.org_positions.length > 0 && (
				<Block title="Organograma" testId="mentor-org">
					<OrgTree positions={content.org_positions} />
				</Block>
			)}

			{content.pops.length > 0 && (
				<Block title="POPs" testId="mentor-pops">
					<div className="space-y-3">
						{content.pops.map((p) => (
							<div key={p.id}>
								<p className="text-sm font-medium text-primary">{p.title}</p>
								{p.objective && (
									<p className="text-xs text-muted">{p.objective}</p>
								)}
								<ol className="mt-1 list-decimal pl-5 text-sm text-muted space-y-0.5">
									{p.steps.map((s) => (
										<li key={s.id}>{s.instruction}</li>
									))}
								</ol>
								{p.attachments.length > 0 && (
									<div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
										{p.attachments.map((a) => {
											const href =
												a.kind === 'link' ? normalizeUrl(a.url) : a.url;
											return href ? (
												<a
													key={a.id}
													href={href}
													target="_blank"
													rel="noreferrer"
													className="inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:underline"
												>
													<Paperclip className="w-3 h-3" />
													{a.name ?? linkLabel(href)}
												</a>
											) : null;
										})}
									</div>
								)}
							</div>
						))}
					</div>
				</Block>
			)}

			{months.length > 0 && (
				<Block title="Financeiro" testId="mentor-financial">
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="text-left text-xs text-muted">
									<th className="py-1 pr-3 font-medium">Mês</th>
									<th className="py-1 pr-3 font-medium">Faturamento</th>
									<th className="py-1 pr-3 font-medium">Lucro</th>
									<th className="py-1 font-medium">Margem</th>
								</tr>
							</thead>
							<tbody>
								{months.map((e) => (
									<tr key={e.id} className="text-muted">
										<td className="py-1 pr-3">{fmtMonth(e.month)}</td>
										<td className="py-1 pr-3">{fmtMoney(e.revenue)}</td>
										<td className="py-1 pr-3">{fmtMoney(e.profit)}</td>
										<td className="py-1">
											{e.margin_pct == null ? '—' : `${e.margin_pct}%`}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</Block>
			)}

			{content.funnel_stages.length > 0 && (
				<Block title="Funil de vendas" testId="mentor-funnel">
					<div className="flex flex-wrap gap-2">
						{[...content.funnel_stages]
							.sort((a, b) => a.position - b.position)
							.map((s) => (
								<Badge key={s.id} tone="blue">
									{s.name}
								</Badge>
							))}
					</div>
				</Block>
			)}

			{content.improvements.length > 0 && (
				<Block title="Melhoria contínua" testId="mentor-improvements">
					<ul className="space-y-2 text-sm">
						{content.improvements.map((c) => (
							<li key={c.id}>
								<p className="text-primary">{c.problem}</p>
								<p className="text-xs text-muted">
									{c.result ? `Resultado: ${c.result}` : 'Sem resultado ainda'}
								</p>
							</li>
						))}
					</ul>
				</Block>
			)}
		</div>
	);
}

/** Cada mês fica com a última versão lançada (as antigas são histórico). */
function latestPerMonth(entries: MntFinancialEntry[]): MntFinancialEntry[] {
	const byMonth = new Map<string, MntFinancialEntry>();
	for (const e of entries) {
		const cur = byMonth.get(e.month);
		if (!cur || e.version > cur.version) byMonth.set(e.month, e);
	}
	return [...byMonth.values()].sort((a, b) => b.month.localeCompare(a.month));
}

function fmtMonth(month: string): string {
	const [y, m] = month.split('-');
	return y && m ? `${m}/${y}` : month;
}

function OrgTree({ positions }: { positions: MntOrgPosition[] }) {
	const ids = new Set(positions.map((p) => p.id));
	const children = (parent: string | null) =>
		positions.filter((p) =>
			parent === null
				? !p.parent_id || !ids.has(p.parent_id)
				: p.parent_id === parent,
		);
	const render = (parent: string | null, depth: number, seen: Set<string>) => (
		<ul className={depth ? 'pl-4 border-l border-subtle ml-1' : ''}>
			{children(parent)
				.filter((p) => !seen.has(p.id))
				.map((p) => {
					const next = new Set(seen).add(p.id);
					return (
						<li key={p.id} className="text-sm py-0.5">
							<span className="text-primary">{p.title}</span>
							{p.holder_name && (
								<span className="text-muted"> · {p.holder_name}</span>
							)}
							{render(p.id, depth + 1, next)}
						</li>
					);
				})}
		</ul>
	);
	return render(null, 0, new Set());
}

/** Ferramentas do aluno com o selo do mentor (Validar / Desfazer). */
function ToolValidationList({
	journeyId,
	map,
}: {
	journeyId: string;
	map: CompanyMap;
}) {
	const { validate, unvalidate } = useMentorToolValidation(journeyId);
	const tools = map.areas.flatMap((a) => a.tools);
	const busy = validate.isPending || unvalidate.isPending;
	const onError = (e: unknown) =>
		toast.error(mentoriaErrorMessage(e, 'Não foi possível salvar o selo.'));

	return (
		<ul
			className="divide-y divide-slate-100 dark:divide-white/5 border-t border-slate-100 dark:border-white/5"
			data-testid="tool-validation-list"
		>
			{tools.map((t) => (
				<li
					key={t.key}
					className="flex items-center justify-between gap-3 py-2 text-sm"
					data-tool-key={t.key}
				>
					<div className="min-w-0 flex-1">
						<p className="inline-flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
							{t.validated && <ValidatedMark />}
							{t.name}
						</p>
						<div className="max-w-40 mt-1">
							<ProgressBar pct={t.completion_pct} />
						</div>
					</div>
					{t.validated ? (
						<button
							type="button"
							className={secondaryBtn}
							disabled={busy || !t.instance_id}
							onClick={() =>
								t.instance_id &&
								unvalidate.mutate(t.instance_id, {
									onSuccess: () => toast.success('Validação desfeita.'),
									onError,
								})
							}
						>
							<RotateCcw className="w-3.5 h-3.5" />
							Desfazer
						</button>
					) : (
						<button
							type="button"
							className={primaryBtn}
							disabled={busy || !t.instance_id}
							title={t.instance_id ? undefined : 'Ainda não iniciada'}
							onClick={() =>
								t.instance_id &&
								validate.mutate(t.instance_id, {
									onSuccess: () => toast.success('Ferramenta validada!'),
									onError,
								})
							}
						>
							<CheckCircle2 className="w-4 h-4" />
							Validar ferramenta
						</button>
					)}
				</li>
			))}
		</ul>
	);
}
