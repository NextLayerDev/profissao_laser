'use client';

import {
	Building2,
	CheckCircle2,
	ClipboardList,
	ListTodo,
	Loader2,
	MessageSquare,
	Radar as RadarIcon,
	Target,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Header } from '@/components/dashboard/header';
import { CompanyMapRadar } from '@/modules/mentoria/components/company-map-radar';
import { SemaphoreBadge } from '@/modules/mentoria/components/semaphore-badge';
import { useJourneyOverview } from '@/modules/mentoria/hooks';
import type {
	MntFormSubmission,
	MntJourneyMeeting,
	MntKpi,
	MntTask,
} from '@/modules/mentoria/types';
import { isUnknownAnswer } from '@/modules/mentoria/types';
import {
	mentoriaErrorMessage,
	useMentorCommentTask,
	useMentorCompanyMap,
	useMentorJourneyKpis,
	useMentorJourneyTasks,
	useMentorMeetingMutations,
	useMentorSubmissions,
} from '../../_components/admin-hooks';
import {
	Badge,
	Card,
	EmptyState,
	Field,
	formatDate,
	formatDateTime,
	inputClass,
	Modal,
	PageTitle,
	ProgressBar,
	primaryBtn,
	Spinner,
	secondaryBtn,
} from '../../_components/ui';

const MEETING_STATUS: Record<
	string,
	{ tone: 'green' | 'amber' | 'blue' | 'slate'; label: string }
> = {
	locked: { tone: 'slate', label: 'Bloqueado' },
	available: { tone: 'blue', label: 'Disponível' },
	in_progress: { tone: 'amber', label: 'Em andamento' },
	done: { tone: 'green', label: 'Concluído' },
};

const TASK_STATUS: Record<
	string,
	{ tone: 'green' | 'amber' | 'red' | 'slate' | 'blue'; label: string }
> = {
	pending: { tone: 'slate', label: 'Pendente' },
	in_progress: { tone: 'amber', label: 'Em andamento' },
	done: { tone: 'green', label: 'Concluída' },
	overdue: { tone: 'red', label: 'Atrasada' },
	cancelled: { tone: 'slate', label: 'Cancelada' },
};

const SUBMISSION_CONTEXT: Record<string, string> = {
	diagnostic: 'Diagnóstico (Foto Zero)',
	meeting_exercise: 'Exercício de encontro',
	tool: 'Ferramenta',
	final_assessment: 'Avaliação final',
};

function SectionTitle({
	icon: Icon,
	children,
}: {
	icon: typeof Target;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-center gap-2 mb-4">
			<Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
			<h3 className="text-lg font-semibold text-slate-900 dark:text-white">
				{children}
			</h3>
		</div>
	);
}

export default function JourneyDrilldownPage() {
	const { journeyId } = useParams<{ journeyId: string }>();
	const overview = useJourneyOverview(journeyId);
	const companyMap = useMentorCompanyMap(journeyId);
	const tasks = useMentorJourneyTasks(journeyId);
	const kpis = useMentorJourneyKpis(journeyId);
	const submissions = useMentorSubmissions(journeyId);
	const { validate, feedback } = useMentorMeetingMutations(journeyId);
	const commentTask = useMentorCommentTask(journeyId);

	const [feedbackFor, setFeedbackFor] = useState<MntJourneyMeeting | null>(
		null,
	);
	const [commentFor, setCommentFor] = useState<MntTask | null>(null);

	const data = overview.data;
	const company = data?.company;

	const doValidate = async (meeting: MntJourneyMeeting) => {
		try {
			await validate.mutateAsync(meeting.id);
			toast.success(`Encontro ${meeting.position} validado`);
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao validar o encontro'));
		}
	};

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />
			<main className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
				<PageTitle
					title={company ? company.name : 'Mentoria da empresa'}
					description="Visão do mentor: encontros, mapa da empresa, tarefas, indicadores e formulários respondidos."
					backHref="/mentoria-admin/turmas"
				/>

				{overview.isLoading ? (
					<Spinner />
				) : overview.isError ? (
					<Card>
						<EmptyState message="Erro ao carregar a jornada. Verifique se você é mentor da turma desta empresa." />
					</Card>
				) : !data ? (
					<Card>
						<EmptyState message="Jornada não encontrada." />
					</Card>
				) : (
					<div className="space-y-10">
						{/* Cabeçalho da empresa */}
						<Card className="p-5">
							<div className="flex items-start justify-between gap-4 flex-wrap">
								<div className="flex items-start gap-3">
									<div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
										<Building2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
									</div>
									<div>
										<p className="font-semibold text-slate-900 dark:text-white">
											{company?.name ?? '—'}
										</p>
										<p className="text-sm text-slate-500 dark:text-gray-400">
											{[company?.segment, company?.city, company?.state]
												.filter(Boolean)
												.join(' · ') || 'Sem dados cadastrais'}
										</p>
										{company?.email && (
											<p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">
												{company.email}
												{company.phone ? ` · ${company.phone}` : ''}
											</p>
										)}
									</div>
								</div>
								<div className="min-w-52">
									<p className="text-xs text-slate-500 dark:text-gray-400 mb-1">
										Progresso da jornada — {data.progress.meetings_done}/
										{data.progress.meetings_total} encontros
									</p>
									<ProgressBar pct={data.progress.progress_pct} />
									{data.journey?.maturity_score != null && (
										<p className="text-xs text-slate-500 dark:text-gray-400 mt-2">
											Maturidade: {Math.round(data.journey.maturity_score)}%
										</p>
									)}
								</div>
							</div>
						</Card>

						{/* Timeline dos encontros */}
						<section>
							<SectionTitle icon={Target}>Encontros</SectionTitle>
							{!data.meetings.length ? (
								<Card>
									<EmptyState message="Nenhum encontro na jornada." />
								</Card>
							) : (
								<div className="space-y-3">
									{data.meetings.map((m) => {
										const st = MEETING_STATUS[m.status] ?? {
											tone: 'slate' as const,
											label: m.status,
										};
										return (
											<Card key={m.id} className="p-4">
												<div className="flex items-start justify-between gap-4 flex-wrap">
													<div className="flex items-start gap-3">
														<div
															className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
																m.status === 'done'
																	? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
																	: 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-gray-400'
															}`}
														>
															{m.position}
														</div>
														<div>
															<p className="font-medium text-slate-900 dark:text-white">
																{m.template?.title ?? `Encontro ${m.position}`}
															</p>
															<div className="flex items-center gap-2 mt-1 flex-wrap">
																<Badge tone={st.tone}>{st.label}</Badge>
																{m.student_completed_at && (
																	<span className="text-xs text-slate-400 dark:text-gray-500">
																		Concluído pelo aluno em{' '}
																		{formatDate(m.student_completed_at)}
																	</span>
																)}
																{m.mentor_validated_at && (
																	<span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
																		<CheckCircle2 className="w-3.5 h-3.5" />
																		Validado em{' '}
																		{formatDate(m.mentor_validated_at)}
																	</span>
																)}
															</div>
															{m.mentor_feedback && (
																<p className="text-sm text-slate-600 dark:text-gray-400 mt-2 border-l-2 border-violet-400 pl-3">
																	{m.mentor_feedback}
																</p>
															)}
														</div>
													</div>
													<div className="flex gap-2">
														<button
															type="button"
															className={secondaryBtn}
															onClick={() => setFeedbackFor(m)}
														>
															<MessageSquare className="w-3.5 h-3.5" />
															Feedback
														</button>
														{!m.mentor_validated_at && (
															<button
																type="button"
																className={primaryBtn}
																onClick={() => doValidate(m)}
																disabled={validate.isPending}
															>
																<CheckCircle2 className="w-4 h-4" />
																Validar
															</button>
														)}
													</div>
												</div>
											</Card>
										);
									})}
								</div>
							)}
						</section>

						{/* Mapa da empresa */}
						<section>
							<SectionTitle icon={RadarIcon}>Mapa da empresa</SectionTitle>
							<Card className="p-5">
								{companyMap.isLoading ? (
									<Spinner />
								) : companyMap.data ? (
									<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
										<CompanyMapRadar map={companyMap.data} />
										<div>
											<p className="text-sm text-slate-500 dark:text-gray-400 mb-3">
												Maturidade geral:{' '}
												<span className="font-semibold text-slate-900 dark:text-white">
													{Math.round(companyMap.data.overall_pct)}%
												</span>
											</p>
											<ul className="space-y-2">
												{companyMap.data.areas.map((a) => (
													<li
														key={a.area}
														className="flex items-center gap-3 text-sm"
													>
														<span className="w-28 text-slate-600 dark:text-gray-400 capitalize">
															{a.area}
														</span>
														<div className="flex-1">
															<ProgressBar pct={a.maturity_pct} />
														</div>
													</li>
												))}
											</ul>
										</div>
									</div>
								) : (
									<EmptyState message="Mapa da empresa indisponível." />
								)}
							</Card>
						</section>

						{/* Tarefas */}
						<section>
							<SectionTitle icon={ListTodo}>Tarefas do aluno</SectionTitle>
							<Card>
								{tasks.isLoading ? (
									<Spinner />
								) : !tasks.data?.length ? (
									<EmptyState message="Nenhuma tarefa registrada." />
								) : (
									<ul className="divide-y divide-slate-100 dark:divide-white/5">
										{tasks.data.map((t) => {
											const st = TASK_STATUS[t.status] ?? {
												tone: 'slate' as const,
												label: t.status,
											};
											return (
												<li
													key={t.id}
													className="px-5 py-4 flex items-start justify-between gap-4 flex-wrap"
												>
													<div className="min-w-0">
														<p className="font-medium text-slate-900 dark:text-white">
															{t.title}
														</p>
														<div className="flex items-center gap-2 mt-1 flex-wrap">
															<Badge tone={st.tone}>{st.label}</Badge>
															{t.due_date && (
																<span className="text-xs text-slate-400 dark:text-gray-500">
																	Prazo: {formatDate(t.due_date)}
																</span>
															)}
														</div>
														{t.mentor_comment && (
															<p className="text-sm text-slate-600 dark:text-gray-400 mt-2 border-l-2 border-violet-400 pl-3">
																{t.mentor_comment}
															</p>
														)}
													</div>
													<button
														type="button"
														className={secondaryBtn}
														onClick={() => setCommentFor(t)}
													>
														<MessageSquare className="w-3.5 h-3.5" />
														Comentar
													</button>
												</li>
											);
										})}
									</ul>
								)}
							</Card>
						</section>

						{/* KPIs */}
						<section>
							<SectionTitle icon={Target}>Indicadores (KPIs)</SectionTitle>
							<Card>
								{kpis.isLoading ? (
									<Spinner />
								) : !kpis.data?.length ? (
									<EmptyState message="Nenhum indicador cadastrado." />
								) : (
									<div className="overflow-x-auto">
										<table className="w-full text-sm">
											<thead>
												<tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400 border-b border-slate-200 dark:border-white/10">
													<th className="px-5 py-3 font-medium">Indicador</th>
													<th className="px-5 py-3 font-medium">Meta</th>
													<th className="px-5 py-3 font-medium">
														Última medição
													</th>
													<th className="px-5 py-3 font-medium">Semáforo</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-slate-100 dark:divide-white/5">
												{kpis.data.map((k: MntKpi) => (
													<tr key={k.id}>
														<td className="px-5 py-3">
															<p className="font-medium text-slate-900 dark:text-white">
																{k.name}
															</p>
															<p className="text-xs text-slate-400 dark:text-gray-500">
																{k.category}
																{k.owner_name ? ` · ${k.owner_name}` : ''}
															</p>
														</td>
														<td className="px-5 py-3 text-slate-600 dark:text-gray-400">
															{k.target != null
																? `${k.target}${k.unit ? ` ${k.unit}` : ''}`
																: '—'}
														</td>
														<td className="px-5 py-3 text-slate-600 dark:text-gray-400">
															{k.latest_measurement
																? `${k.latest_measurement.value ?? '—'} (${formatDate(k.latest_measurement.measured_at)})`
																: '—'}
														</td>
														<td className="px-5 py-3">
															<SemaphoreBadge
																value={k.current_semaphore ?? 'unmeasured'}
															/>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								)}
							</Card>
						</section>

						{/* Submissões de formulário */}
						<section>
							<SectionTitle icon={ClipboardList}>
								Formulários respondidos
							</SectionTitle>
							{submissions.isLoading ? (
								<Card>
									<Spinner />
								</Card>
							) : !submissions.data?.length ? (
								<Card>
									<EmptyState message="Nenhum formulário respondido ainda." />
								</Card>
							) : (
								<div className="space-y-3">
									{submissions.data.map((s) => (
										<SubmissionCard key={s.id} submission={s} />
									))}
								</div>
							)}
						</section>
					</div>
				)}
			</main>

			{feedbackFor && (
				<FeedbackModal
					meeting={feedbackFor}
					onClose={() => setFeedbackFor(null)}
					onSave={async (text) => {
						try {
							await feedback.mutateAsync({
								meetingId: feedbackFor.id,
								feedback: text,
							});
							toast.success('Feedback registrado');
							setFeedbackFor(null);
						} catch (err) {
							toast.error(
								mentoriaErrorMessage(err, 'Erro ao salvar o feedback'),
							);
						}
					}}
					pending={feedback.isPending}
				/>
			)}

			{commentFor && (
				<CommentModal
					task={commentFor}
					onClose={() => setCommentFor(null)}
					onSave={async (text) => {
						try {
							await commentTask.mutateAsync({
								taskId: commentFor.id,
								comment: text,
							});
							toast.success('Comentário registrado');
							setCommentFor(null);
						} catch (err) {
							toast.error(
								mentoriaErrorMessage(err, 'Erro ao salvar o comentário'),
							);
						}
					}}
					pending={commentTask.isPending}
				/>
			)}
		</div>
	);
}

function FeedbackModal({
	meeting,
	onClose,
	onSave,
	pending,
}: {
	meeting: MntJourneyMeeting;
	onClose: () => void;
	onSave: (text: string) => void;
	pending: boolean;
}) {
	const [text, setText] = useState(meeting.mentor_feedback ?? '');
	return (
		<Modal title={`Feedback — Encontro ${meeting.position}`} onClose={onClose}>
			<div className="space-y-4">
				<Field label="Feedback do mentor" required>
					<textarea
						className={`${inputClass} min-h-32`}
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder="O que foi bem, o que precisa melhorar, próximos passos..."
					/>
				</Field>
				<div className="flex justify-end gap-2">
					<button type="button" className={secondaryBtn} onClick={onClose}>
						Cancelar
					</button>
					<button
						type="button"
						className={primaryBtn}
						disabled={pending || !text.trim()}
						onClick={() => onSave(text.trim())}
					>
						{pending && <Loader2 className="w-4 h-4 animate-spin" />}
						Salvar feedback
					</button>
				</div>
			</div>
		</Modal>
	);
}

function CommentModal({
	task,
	onClose,
	onSave,
	pending,
}: {
	task: MntTask;
	onClose: () => void;
	onSave: (text: string) => void;
	pending: boolean;
}) {
	const [text, setText] = useState(task.mentor_comment ?? '');
	return (
		<Modal title={`Comentário — ${task.title}`} onClose={onClose}>
			<div className="space-y-4">
				<Field label="Comentário do mentor" required>
					<textarea
						className={`${inputClass} min-h-28`}
						value={text}
						onChange={(e) => setText(e.target.value)}
					/>
				</Field>
				<div className="flex justify-end gap-2">
					<button type="button" className={secondaryBtn} onClick={onClose}>
						Cancelar
					</button>
					<button
						type="button"
						className={primaryBtn}
						disabled={pending || !text.trim()}
						onClick={() => onSave(text.trim())}
					>
						{pending && <Loader2 className="w-4 h-4 animate-spin" />}
						Salvar comentário
					</button>
				</div>
			</div>
		</Modal>
	);
}

function SubmissionCard({ submission }: { submission: MntFormSubmission }) {
	const [open, setOpen] = useState(false);
	const entries = Object.entries(submission.answers ?? {});
	return (
		<Card className="p-4">
			<button
				type="button"
				className="w-full flex items-center justify-between gap-3 text-left"
				onClick={() => setOpen((v) => !v)}
			>
				<div>
					<p className="font-medium text-slate-900 dark:text-white">
						{SUBMISSION_CONTEXT[submission.context] ?? submission.context}
					</p>
					<p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">
						{submission.status === 'submitted'
							? `Enviado em ${formatDateTime(submission.submitted_at)}`
							: 'Rascunho'}{' '}
						· v{submission.version}
					</p>
				</div>
				<span className="text-sm text-violet-600 dark:text-violet-400">
					{open ? 'Ocultar respostas' : `Ver respostas (${entries.length})`}
				</span>
			</button>
			{open && (
				<dl className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 border-t border-slate-100 dark:border-white/5 pt-4">
					{entries.length === 0 && (
						<p className="text-sm text-slate-500 dark:text-gray-400">
							Sem respostas.
						</p>
					)}
					{entries.map(([key, value]) => (
						<div key={key}>
							<dt className="text-xs uppercase tracking-wide text-slate-400 dark:text-gray-500">
								{key.replaceAll('_', ' ')}
							</dt>
							<dd className="text-sm text-slate-800 dark:text-slate-200 mt-0.5 break-words">
								{renderAnswer(value)}
							</dd>
						</div>
					))}
				</dl>
			)}
		</Card>
	);
}

function renderAnswer(value: unknown): string {
	if (isUnknownAnswer(value)) return '[ A LEVANTAR / NÃO MEDIDO ]';
	if (value == null || value === '') return '—';
	if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
	if (Array.isArray(value)) return value.map(String).join(', ');
	if (typeof value === 'object') return JSON.stringify(value);
	return String(value);
}
