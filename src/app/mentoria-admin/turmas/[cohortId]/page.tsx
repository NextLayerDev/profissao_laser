'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Header } from '@/components/dashboard/header';
import { useCohortDashboard, useMentorCohorts } from '@/modules/mentoria/hooks';
import type { CohortDashboardRow } from '@/modules/mentoria/types';
import {
	useCohortsAdmin,
	useIsMentoriaAdmin,
} from '../../_components/admin-hooks';
import {
	Badge,
	Card,
	EmptyState,
	formatDate,
	PageTitle,
	ProgressBar,
	Spinner,
} from '../../_components/ui';

function journeyStatusBadge(status: string) {
	const map: Record<
		string,
		{ tone: 'green' | 'blue' | 'red' | 'slate'; label: string }
	> = {
		active: { tone: 'green', label: 'Ativa' },
		completed: { tone: 'blue', label: 'Concluída' },
		abandoned: { tone: 'red', label: 'Abandonada' },
	};
	const cfg = map[status] ?? { tone: 'slate' as const, label: status };
	return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}

type SortKey = 'risk' | 'name' | 'progress';

const SORTS: Record<
	SortKey,
	(a: CohortDashboardRow, b: CohortDashboardRow) => number
> = {
	// Mais urgente primeiro; empate: quem está parado há mais tempo.
	risk: (a, b) =>
		(b.risk_score ?? 0) - (a.risk_score ?? 0) ||
		(b.days_inactive ?? 0) - (a.days_inactive ?? 0),
	name: (a, b) => a.company.name.localeCompare(b.company.name),
	progress: (a, b) => a.progress_pct - b.progress_pct,
};

/** Sem os sinais (API sem a migration do dashboard): não dá para dizer "Em dia". */
const hasRiskSignals = (row: CohortDashboardRow) =>
	row.diagnostic_pending != null;

function RiskBadges({ row }: { row: CohortDashboardRow }) {
	if (!hasRiskSignals(row)) return null;
	const flags = row.risk_flags ?? [];
	if (!flags.length) {
		return row.status === 'active' ? <Badge tone="green">Em dia</Badge> : null;
	}
	return (
		<div className="flex flex-wrap gap-1">
			{flags.includes('stalled') && (
				<Badge tone="red">Parado {row.days_inactive}d</Badge>
			)}
			{flags.includes('diagnostic_pending') && (
				<Badge tone="amber">Sem diagnóstico</Badge>
			)}
			{flags.includes('overdue_tasks') && (
				<Badge tone="red">
					{row.overdue_tasks} atrasada{(row.overdue_tasks ?? 0) > 1 ? 's' : ''}
				</Badge>
			)}
		</div>
	);
}

function plural(n: number, one: string): string {
	return `${n} ${one}${n === 1 ? '' : 's'}`;
}

function ago(days: number | null | undefined): string {
	if (days == null) return '—';
	if (days === 0) return 'hoje';
	return days === 1 ? 'ontem' : `há ${days}d`;
}

export default function CohortDashboardPage() {
	const { cohortId } = useParams<{ cohortId: string }>();
	const dashboard = useCohortDashboard(cohortId);
	const cohorts = useMentorCohorts();
	// Admin que não é mentor da turma não a acha em useMentorCohorts: cai na
	// lista de todas (para staff, useCohortsAdmin já devolve as dele).
	const allCohorts = useCohortsAdmin();
	const { isAdmin } = useIsMentoriaAdmin();
	const cohort =
		cohorts.data?.find((c) => c.id === cohortId) ??
		allCohorts.data?.find((c) => c.id === cohortId);
	const [sort, setSort] = useState<SortKey>('risk');
	const rows = useMemo(
		() => [...(dashboard.data ?? [])].sort(SORTS[sort]),
		[dashboard.data, sort],
	);
	const count = (flag: 'stalled' | 'diagnostic_pending' | 'overdue_tasks') =>
		rows.filter((r) => r.risk_flags?.includes(flag)).length;
	const hasSignals = rows.some(hasRiskSignals);

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />
			<main className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
				<PageTitle
					title={cohort ? `Turma — ${cohort.name}` : 'Dashboard da turma'}
					description="Quem precisa de atenção aparece primeiro."
					backHref={isAdmin ? '/mentoria-admin/turmas' : '/mentoria-admin'}
				/>

				{hasSignals && rows.length > 0 && (
					<div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
						<div
							data-testid="risk-summary"
							className="flex items-center gap-2 flex-wrap text-sm"
						>
							<Badge tone="red">{plural(count('stalled'), 'parado')}</Badge>
							<Badge tone="amber">
								{count('diagnostic_pending')} sem diagnóstico
							</Badge>
							<Badge tone="red">{count('overdue_tasks')} com atraso</Badge>
						</div>
						<label className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
							Ordenar
							<select
								aria-label="Ordenar"
								className="rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-2 py-1"
								value={sort}
								onChange={(e) => setSort(e.target.value as SortKey)}
							>
								<option value="risk">Risco</option>
								<option value="name">Nome</option>
								<option value="progress">Progresso</option>
							</select>
						</label>
					</div>
				)}

				<Card>
					{dashboard.isLoading ? (
						<Spinner />
					) : dashboard.isError ? (
						<EmptyState message="Erro ao carregar o dashboard. Verifique se você é mentor desta turma." />
					) : !dashboard.data?.length ? (
						<EmptyState message="Nenhum aluno matriculado nesta turma ainda." />
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400 border-b border-slate-200 dark:border-white/10">
										<th className="px-5 py-3 font-medium">Empresa</th>
										<th className="px-5 py-3 font-medium">Aluno</th>
										<th className="px-5 py-3 font-medium">Progresso</th>
										<th className="px-5 py-3 font-medium">Sinais</th>
										<th className="px-5 py-3 font-medium">Atividade</th>
										<th className="px-5 py-3 font-medium">Status</th>
										<th className="px-5 py-3 font-medium text-right">Ações</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 dark:divide-white/5">
									{rows.map((row) => (
										<tr
											key={row.journey_id}
											data-testid="dashboard-row"
											className="hover:bg-slate-50 dark:hover:bg-white/[0.03]"
										>
											<td className="px-5 py-3.5">
												<p className="font-medium text-slate-900 dark:text-white">
													{row.company.name}
												</p>
												{row.company.segment && (
													<p className="text-xs text-slate-400 dark:text-gray-500">
														{row.company.segment}
													</p>
												)}
											</td>
											<td className="px-5 py-3.5">
												<p className="text-slate-700 dark:text-slate-200">
													{row.owner_name ?? '—'}
												</p>
												<p className="text-xs text-slate-400 dark:text-gray-500">
													{row.owner_email ?? ''}
												</p>
											</td>
											<td className="px-5 py-3.5">
												<ProgressBar pct={row.progress_pct} />
												<p className="text-[11px] text-slate-400 dark:text-gray-500 mt-1">
													{row.meetings_done}/{row.meetings_total} encontros
												</p>
											</td>
											<td className="px-5 py-3.5">
												<RiskBadges row={row} />
											</td>
											<td className="px-5 py-3.5 whitespace-nowrap">
												<p className="text-slate-700 dark:text-slate-200">
													{ago(row.days_inactive)}
												</p>
												{row.last_access_at && (
													<p className="text-[11px] text-slate-400 dark:text-gray-500">
														acesso {formatDate(row.last_access_at)}
													</p>
												)}
											</td>
											<td className="px-5 py-3.5">
												{journeyStatusBadge(row.status)}
											</td>
											<td className="px-5 py-3.5 text-right">
												<Link
													href={`/mentoria-admin/jornada/${row.journey_id}`}
													className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline"
												>
													Abrir mentoria
													<ChevronRight className="w-4 h-4" />
												</Link>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</Card>
			</main>
		</div>
	);
}
