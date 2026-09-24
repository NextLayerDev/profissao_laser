'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '@/components/dashboard/header';
import { useCohortDashboard, useMentorCohorts } from '@/modules/mentoria/hooks';
import {
	Badge,
	Card,
	EmptyState,
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

export default function CohortDashboardPage() {
	const { cohortId } = useParams<{ cohortId: string }>();
	const dashboard = useCohortDashboard(cohortId);
	const cohorts = useMentorCohorts();
	const cohort = cohorts.data?.find((c) => c.id === cohortId);

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />
			<main className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
				<PageTitle
					title={cohort ? `Turma — ${cohort.name}` : 'Dashboard da turma'}
					description="Acompanhamento das empresas da turma: progresso na jornada e acesso ao detalhe de cada mentoria."
					backHref="/mentoria-admin/turmas"
				/>

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
										<th className="px-5 py-3 font-medium">Status</th>
										<th className="px-5 py-3 font-medium text-right">Ações</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 dark:divide-white/5">
									{dashboard.data.map((row) => (
										<tr
											key={row.journey_id}
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
