'use client';

import { Button, buttonLabel } from '@upvox-dev/ui';
import { Pencil, Plus, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Text } from 'react-native-css/components/Text';
import { Header } from '@/components/dashboard/header';
import type {
	MentoriaWaitingStudent,
	MntCohort,
} from '@/modules/mentoria/types';
import {
	useCohortsAdmin,
	useIsMentoriaAdmin,
	useWaitingStudents,
} from '../_components/admin-hooks';
import {
	CohortFormModal,
	CohortMentorsModal,
	EnrollBatchModal,
	EnrollStudentModal,
} from '../_components/cohort-modals';
import {
	Card,
	cohortStatusBadge,
	EmptyState,
	formatDate,
	PageTitle,
	Spinner,
} from '../_components/ui';

const ICON_BTN =
	'inline-flex items-center p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white';

type ModalState =
	| { kind: 'create' }
	| { kind: 'edit'; cohort: MntCohort }
	| { kind: 'mentors'; cohort: MntCohort }
	| { kind: 'enroll'; cohort: MntCohort }
	| { kind: 'batch'; students: MentoriaWaitingStudent[] }
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
					help="Crie turmas, defina datas e status, gerencie mentores e matricule alunos."
					backHref="/mentoria-admin"
					actions={
						<Button onPress={() => setModal({ kind: 'create' })}>
							<Plus className="w-4 h-4" />
							{/* O <Button> só embrulha em <Text> quando `children` é uma
							    string pura. Ícone + texto vira um ARRAY, e um array de
							    children bypassa o wrap — o texto cru quebra em runtime
							    ("A text node cannot be a child of a <View>"). */}
							<Text className={buttonLabel({ variant: 'primary' })}>
								Nova turma
							</Text>
						</Button>
					}
				/>

				{/* Antes das turmas: é a lista que pede ação (quem pagou e espera). */}
				<WaitingStudents
					onEnroll={(students) => setModal({ kind: 'batch', students })}
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
												{/* program_key é técnico: fica só no title. */}
												<Link
													href={`/mentoria-admin/turmas/${c.id}`}
													className="font-medium text-slate-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400"
													title={c.program_key}
												>
													{c.name}
												</Link>
											</td>
											<td className="px-5 py-3.5 text-slate-600 dark:text-gray-400">
												{formatDate(c.starts_at)} — {formatDate(c.ends_at)}
											</td>
											<td className="px-5 py-3.5">
												{cohortStatusBadge(c.status)}
											</td>
											<td className="px-5 py-3.5">
												{/* Três botões com texto por linha eram o grosso das
												    palavras da tela: viram ícones com nome acessível. */}
												<div className="flex justify-end gap-1">
													<button
														type="button"
														className={ICON_BTN}
														onClick={() =>
															setModal({ kind: 'edit', cohort: c })
														}
														aria-label={`Editar ${c.name}`}
														title="Editar"
													>
														<Pencil className="w-4 h-4" />
													</button>
													<button
														type="button"
														className={ICON_BTN}
														onClick={() =>
															setModal({ kind: 'mentors', cohort: c })
														}
														aria-label={`Mentores de ${c.name}`}
														title="Mentores"
													>
														<Users className="w-4 h-4" />
													</button>
													<button
														type="button"
														className={ICON_BTN}
														onClick={() =>
															setModal({ kind: 'enroll', cohort: c })
														}
														aria-label={`Matricular aluno em ${c.name}`}
														title="Matricular aluno"
													>
														<UserPlus className="w-4 h-4" />
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
			{modal?.kind === 'batch' && (
				<EnrollBatchModal
					students={modal.students}
					cohorts={cohorts.data ?? []}
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

// ── Aguardando turma ─────────────────────────────────────────────────────────
// Quem comprou o plano com a Mentoria e ainda não tem jornada: a compra não
// matricula ninguém, então sem esta fila o aluno ficava parado sem o admin saber.
function WaitingStudents({
	onEnroll,
}: {
	onEnroll: (students: MentoriaWaitingStudent[]) => void;
}) {
	const { isAdmin } = useIsMentoriaAdmin();
	const waiting = useWaitingStudents();
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const rows = waiting.data ?? [];
	// Seleção só do que ainda está na fila (matriculado some no refetch).
	const picked = rows.filter((r) => selected.has(r.user_id));
	const allPicked = rows.length > 0 && picked.length === rows.length;

	const toggle = (id: string) =>
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});

	// Rota só de admin: o mentor (staff) não matricula.
	if (!isAdmin) return null;

	return (
		<section className="mb-8" aria-label="Aguardando turma">
			<div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
				<div>
					<h3 className="text-title text-primary">
						Aguardando turma{rows.length ? ` (${rows.length})` : ''}
					</h3>
					<p className="text-body text-muted">Têm o plano e ainda sem turma.</p>
				</div>
				{/* String pura: o <Button> embrulha sozinho em <Text>. */}
				<Button onPress={() => onEnroll(picked)} disabled={picked.length === 0}>
					{picked.length > 0
						? `Matricular ${picked.length} na turma…`
						: 'Matricular na turma…'}
				</Button>
			</div>
			<Card>
				{waiting.isLoading ? (
					<Spinner />
				) : waiting.isError ? (
					<EmptyState message="Erro ao carregar a fila." />
				) : rows.length === 0 ? (
					<EmptyState message="Ninguém aguardando turma." />
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400 border-b border-slate-200 dark:border-white/10">
									<th className="px-5 py-3 w-10">
										<input
											type="checkbox"
											aria-label="Selecionar todos"
											className="w-4 h-4 accent-violet-600"
											checked={allPicked}
											onChange={() =>
												setSelected(
													allPicked
														? new Set()
														: new Set(rows.map((r) => r.user_id)),
												)
											}
										/>
									</th>
									<th className="px-5 py-3 font-medium">Aluno</th>
									<th className="px-5 py-3 font-medium">Empresa</th>
									<th className="px-5 py-3 font-medium">Desde</th>
									<th className="px-5 py-3 font-medium text-right">Ação</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100 dark:divide-white/5">
								{rows.map((r) => (
									<tr
										key={r.user_id}
										className="hover:bg-slate-50 dark:hover:bg-white/[0.03]"
									>
										<td className="px-5 py-3.5">
											<input
												type="checkbox"
												aria-label={`Selecionar ${r.name ?? r.email}`}
												className="w-4 h-4 accent-violet-600"
												checked={selected.has(r.user_id)}
												onChange={() => toggle(r.user_id)}
											/>
										</td>
										<td className="px-5 py-3.5">
											<p className="font-medium text-primary">
												{r.name?.trim() || '(sem nome)'}
											</p>
											<p className="text-xs text-muted">{r.email}</p>
										</td>
										<td className="px-5 py-3.5 text-slate-600 dark:text-gray-400">
											{r.company_name ?? '—'}
										</td>
										<td className="px-5 py-3.5 text-slate-600 dark:text-gray-400">
											{formatDate(r.since)}
										</td>
										<td className="px-5 py-3.5">
											<div className="flex justify-end">
												<Button
													variant="secondary"
													onPress={() => onEnroll([r])}
												>
													Matricular
												</Button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</Card>
		</section>
	);
}
