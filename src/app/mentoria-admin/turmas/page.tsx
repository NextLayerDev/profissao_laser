'use client';

import { Pencil, Plus, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Header } from '@/components/dashboard/header';
import type { MntCohort } from '@/modules/mentoria/types';
import { useCohortsAdmin } from '../_components/admin-hooks';
import {
	CohortFormModal,
	CohortMentorsModal,
	EnrollStudentModal,
} from '../_components/cohort-modals';
import {
	Card,
	cohortStatusBadge,
	EmptyState,
	formatDate,
	PageTitle,
	primaryBtn,
	Spinner,
	secondaryBtn,
} from '../_components/ui';

type ModalState =
	| { kind: 'create' }
	| { kind: 'edit'; cohort: MntCohort }
	| { kind: 'mentors'; cohort: MntCohort }
	| { kind: 'enroll'; cohort: MntCohort }
	| null;

export default function TurmasPage() {
	const cohorts = useCohortsAdmin();
	const [modal, setModal] = useState<ModalState>(null);

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />
			<main className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
				<PageTitle
					title="Turmas"
					description="Turmas do programa de mentoria: crie, defina datas e status, gerencie mentores e matricule alunos."
					backHref="/mentoria-admin"
					actions={
						<button
							type="button"
							className={primaryBtn}
							onClick={() => setModal({ kind: 'create' })}
						>
							<Plus className="w-4 h-4" />
							Nova turma
						</button>
					}
				/>

				<Card>
					{cohorts.isLoading ? (
						<Spinner />
					) : cohorts.isError ? (
						<EmptyState message="Erro ao carregar as turmas." />
					) : !cohorts.data?.length ? (
						<EmptyState message="Nenhuma turma criada ainda." />
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400 border-b border-slate-200 dark:border-white/10">
										<th className="px-5 py-3 font-medium">Turma</th>
										<th className="px-5 py-3 font-medium">Período</th>
										<th className="px-5 py-3 font-medium">Status</th>
										<th className="px-5 py-3 font-medium text-right">Ações</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 dark:divide-white/5">
									{cohorts.data.map((c) => (
										<tr
											key={c.id}
											className="hover:bg-slate-50 dark:hover:bg-white/[0.03]"
										>
											<td className="px-5 py-3.5">
												<Link
													href={`/mentoria-admin/turmas/${c.id}`}
													className="font-medium text-slate-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400"
												>
													{c.name}
												</Link>
												<p className="text-xs text-slate-400 dark:text-gray-500">
													{c.program_key}
												</p>
											</td>
											<td className="px-5 py-3.5 text-slate-600 dark:text-gray-400">
												{formatDate(c.starts_at)} — {formatDate(c.ends_at)}
											</td>
											<td className="px-5 py-3.5">
												{cohortStatusBadge(c.status)}
											</td>
											<td className="px-5 py-3.5">
												<div className="flex justify-end gap-2 flex-wrap">
													<button
														type="button"
														className={secondaryBtn}
														onClick={() =>
															setModal({ kind: 'edit', cohort: c })
														}
													>
														<Pencil className="w-3.5 h-3.5" />
														Editar
													</button>
													<button
														type="button"
														className={secondaryBtn}
														onClick={() =>
															setModal({ kind: 'mentors', cohort: c })
														}
													>
														<Users className="w-3.5 h-3.5" />
														Mentores
													</button>
													<button
														type="button"
														className={secondaryBtn}
														onClick={() =>
															setModal({ kind: 'enroll', cohort: c })
														}
													>
														<UserPlus className="w-3.5 h-3.5" />
														Matricular
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</Card>
			</main>

			{modal?.kind === 'create' && (
				<CohortFormModal cohort={null} onClose={() => setModal(null)} />
			)}
			{modal?.kind === 'edit' && (
				<CohortFormModal cohort={modal.cohort} onClose={() => setModal(null)} />
			)}
			{modal?.kind === 'mentors' && (
				<CohortMentorsModal
					cohort={modal.cohort}
					onClose={() => setModal(null)}
				/>
			)}
			{modal?.kind === 'enroll' && (
				<EnrollStudentModal
					cohort={modal.cohort}
					onClose={() => setModal(null)}
				/>
			)}
		</div>
	);
}
