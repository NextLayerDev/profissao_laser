'use client';

import {
	BadgeCheck,
	BookOpen,
	CheckCircle2,
	ClipboardList,
	Flag,
	ListChecks,
	MessageSquareQuote,
	Plus,
	Target,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import {
	useCompleteMeeting,
	useJourneyMeetings,
	useTaskMutations,
	useTasks,
} from '@/modules/mentoria/hooks';
import type {
	MeetingTaskPrompt,
	MntJourneyMeeting,
} from '@/modules/mentoria/types';
import {
	BTN_GHOST,
	BTN_PRIMARY,
	CARD,
	EmptyState,
	JourneyGate,
	MntHeader,
	MntSkeleton,
	meetingStatusLabel,
} from '../../_components/shared';

export default function EncontroPage() {
	const params = useParams<{ meetingId: string }>();
	return (
		<SubscriptionGate toolKey="mentoria_360">
			<JourneyGate>
				{({ journeyId }) => (
					<EncontroContent journeyId={journeyId} meetingId={params.meetingId} />
				)}
			</JourneyGate>
		</SubscriptionGate>
	);
}

function EncontroContent({
	journeyId,
	meetingId,
}: {
	journeyId: string;
	meetingId: string;
}) {
	const { data: meetings, isLoading } = useJourneyMeetings(journeyId);
	const complete = useCompleteMeeting(journeyId);

	if (isLoading) return <MntSkeleton />;

	const meeting = (meetings ?? []).find((m) => m.id === meetingId);

	if (!meeting) {
		return (
			<div className="p-4 md:p-8">
				<MntHeader
					title="Encontro"
					icon={BookOpen}
					backHref="/course/mentoria/jornada"
				/>
				<EmptyState
					title="Encontro não encontrado"
					description="Volte à jornada e escolha um encontro disponível."
				>
					<Link href="/course/mentoria/jornada" className={BTN_GHOST}>
						Ver jornada
					</Link>
				</EmptyState>
			</div>
		);
	}

	if (meeting.status === 'locked') {
		return (
			<div className="p-4 md:p-8">
				<MntHeader
					title={meeting.template?.title ?? `Encontro ${meeting.position}`}
					icon={BookOpen}
					backHref="/course/mentoria/jornada"
				/>
				<EmptyState
					title="Este encontro ainda está bloqueado"
					description="Conclua os encontros anteriores para desbloquear este conteúdo."
				>
					<Link href="/course/mentoria/jornada" className={BTN_GHOST}>
						Voltar à jornada
					</Link>
				</EmptyState>
			</div>
		);
	}

	const tpl = meeting.template;
	const canComplete =
		meeting.status === 'available' || meeting.status === 'in_progress';

	const handleComplete = () => {
		complete.mutate(meeting.id, {
			onSuccess: () => toast.success('Encontro concluído! Bom trabalho.'),
			onError: () => toast.error('Não foi possível concluir o encontro.'),
		});
	};

	return (
		<div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
			<MntHeader
				title={`${meeting.position}. ${tpl?.title ?? 'Encontro'}`}
				subtitle={tpl?.subtitle ?? meetingStatusLabel(meeting.status)}
				icon={BookOpen}
				backHref="/course/mentoria/jornada"
			/>

			{meeting.mentor_validated_at && (
				<div className={`${CARD} p-4 flex items-center gap-3`}>
					<BadgeCheck className="w-5 h-5 text-emerald-500 shrink-0" />
					<p className="text-sm text-slate-700 dark:text-slate-300">
						Encontro validado pelo mentor.
					</p>
				</div>
			)}

			{meeting.mentor_feedback && (
				<section className={`${CARD} p-5`}>
					<p className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 dark:text-teal-400 mb-2">
						<MessageSquareQuote className="w-4 h-4" />
						Feedback do mentor
					</p>
					<p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
						{meeting.mentor_feedback}
					</p>
				</section>
			)}

			{tpl?.objectives && (
				<section className={`${CARD} p-5`}>
					<h2 className="inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100 mb-2">
						<Target className="w-4 h-4 text-teal-600 dark:text-teal-400" />
						Objetivos
					</h2>
					<p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
						{tpl.objectives}
					</p>
				</section>
			)}

			{tpl?.content_md && (
				<section className={`${CARD} p-5`}>
					<h2 className="inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100 mb-2">
						<BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
						Conteúdo do encontro
					</h2>
					<div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
						{tpl.content_md}
					</div>
				</section>
			)}

			{tpl?.expected_result && (
				<section className={`${CARD} p-5`}>
					<h2 className="inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100 mb-2">
						<Flag className="w-4 h-4 text-teal-600 dark:text-teal-400" />
						Resultado esperado
					</h2>
					<p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
						{tpl.expected_result}
					</p>
				</section>
			)}

			<ExerciseSection meeting={meeting} journeyId={journeyId} />

			<div
				className={`${CARD} p-4 flex flex-wrap items-center justify-between gap-3`}
			>
				<p className="text-sm text-slate-500 dark:text-gray-400">
					{meeting.status === 'done'
						? 'Você concluiu este encontro.'
						: 'Concluiu as atividades? Marque o encontro como concluído.'}
				</p>
				{canComplete && (
					<button
						type="button"
						className={BTN_PRIMARY}
						onClick={handleComplete}
						disabled={complete.isPending}
					>
						<CheckCircle2 className="w-4 h-4" />
						{complete.isPending ? 'Concluindo...' : 'Concluir encontro'}
					</button>
				)}
			</div>
		</div>
	);
}

function ExerciseSection({
	meeting,
	journeyId,
}: {
	meeting: MntJourneyMeeting;
	journeyId: string;
}) {
	const tpl = meeting.template;
	const prompts: MeetingTaskPrompt[] = tpl?.task_prompts ?? [];
	const { data: tasks } = useTasks(journeyId);
	const { create } = useTaskMutations(journeyId);

	const meetingTasks = (tasks ?? []).filter(
		(t) => t.origin_type === 'meeting' && t.origin_id === meeting.id,
	);

	const addTask = (prompt: MeetingTaskPrompt) => {
		create.mutate(
			{
				title: prompt.title,
				description: prompt.description ?? null,
				priority: prompt.priority ?? 'medium',
				origin_type: 'meeting',
				origin_id: meeting.id,
			},
			{
				onSuccess: () => toast.success('Tarefa adicionada às suas tarefas!'),
				onError: () => toast.error('Não foi possível adicionar a tarefa.'),
			},
		);
	};

	const hasExercise = !!tpl?.exercise_form_template_id;
	const isDiagnostic = hasExercise && meeting.position === 1;

	if (!hasExercise && prompts.length === 0) return null;

	return (
		<section className={`${CARD} p-5`}>
			<h2 className="inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100 mb-3">
				<ListChecks className="w-4 h-4 text-teal-600 dark:text-teal-400" />
				Exercício do encontro
			</h2>

			{isDiagnostic && (
				<div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-4 mb-4">
					<p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
						O exercício deste encontro é o <strong>Raio-X inicial</strong> da
						sua empresa — o diagnóstico que vira a sua Foto Zero.
					</p>
					<Link href="/course/mentoria/diagnostico" className={BTN_PRIMARY}>
						<ClipboardList className="w-4 h-4" />
						Fazer o diagnóstico
					</Link>
				</div>
			)}

			{hasExercise && !isDiagnostic && (
				<p className="text-sm text-slate-500 dark:text-gray-400 mb-4">
					O exercício prático deste encontro é feito junto com o mentor. As
					tarefas sugeridas abaixo ajudam a colocá-lo em prática.
				</p>
			)}

			{prompts.length > 0 && (
				<div className="space-y-2">
					<p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">
						Tarefas sugeridas
					</p>
					{prompts.map((p) => {
						const alreadyAdded = meetingTasks.some((t) => t.title === p.title);
						return (
							<div
								key={p.title}
								className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 dark:border-white/10 p-3"
							>
								<div className="min-w-0">
									<p className="text-sm font-medium text-slate-900 dark:text-slate-100">
										{p.title}
									</p>
									{p.description && (
										<p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
											{p.description}
										</p>
									)}
								</div>
								{alreadyAdded ? (
									<span className="text-xs text-teal-600 dark:text-teal-400 shrink-0 inline-flex items-center gap-1">
										<CheckCircle2 className="w-3.5 h-3.5" />
										Adicionada
									</span>
								) : (
									<button
										type="button"
										className={`${BTN_GHOST} !px-3 !py-1.5 shrink-0`}
										onClick={() => addTask(p)}
										disabled={create.isPending}
									>
										<Plus className="w-3.5 h-3.5" />
										Adicionar
									</button>
								)}
							</div>
						);
					})}
				</div>
			)}
		</section>
	);
}
