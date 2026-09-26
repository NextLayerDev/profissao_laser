'use client';

// Apresentação do detalhe de um encontro da Jornada — recebe o encontro, as
// tarefas já filtradas pela origem e devolve os eventos. Quem busca e quem muta
// é o `page.tsx`, que também trata os dois estados de guarda (encontro
// inexistente e encontro bloqueado) antes de chegar aqui.
//
// Mesma razão da vista da linha do tempo (`../../_components/jornada-view.tsx`):
// encontro concluído, validado pelo mentor, com feedback ou com tarefas
// sugeridas parcialmente adicionadas são combinações caras de reproduzir de
// propósito numa jornada real. `app/(dev)/mentoria-jornada-check` monta cada
// uma com fixtures.

import { Button, buttonLabel } from '@upvox-dev/ui';
import {
	ArrowRight,
	BadgeCheck,
	BookOpen,
	CalendarClock,
	CheckCircle2,
	ClipboardList,
	FileText,
	Flag,
	ListChecks,
	Lock,
	MessageSquareQuote,
	Plus,
	Target,
	Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useState } from 'react';
import { Text } from 'react-native-css/components/Text';
import { Markdown } from '@/modules/mentoria/components/markdown';
import type {
	MeetingTaskPrompt,
	MntJourneyMeeting,
	MntMaterial,
	MntTask,
} from '@/modules/mentoria/types';
import {
	BTN_PRIMARY,
	CARD,
	ConfirmDialog,
	fmtDateTime,
	linkLabel,
	MntHeader,
	meetingStatusLabel,
} from '../../../_components/shared';

/** Ferramenta ligada ao encontro, já com o link resolvido pelo container. */
export type MeetingTool = {
	id: string;
	name: string;
	href: string;
	/** Seção Ferramentas bloqueada pelo admin: mostra o card sem link. */
	locked: boolean;
};

export function EncontroView({
	meeting,
	meetingTasks,
	canComplete,
	completing,
	onComplete,
	addingTask,
	onAddTask,
	diagnostic,
	exercise,
	tools = [],
	materials = [],
	nextMeeting = null,
}: {
	/** Formulário do exercício, montado pelo container (a view não busca dados). */
	exercise?: ReactNode;
	tools?: MeetingTool[];
	materials?: MntMaterial[];
	/** Encontro seguinte da jornada (null no último). */
	nextMeeting?: MntJourneyMeeting | null;
	meeting: MntJourneyMeeting;
	/** Tarefas já filtradas pela origem deste encontro. */
	meetingTasks: MntTask[];
	canComplete: boolean;
	completing: boolean;
	onComplete: () => void;
	addingTask: boolean;
	/** O container monta o corpo da tarefa: só ele conhece a origem e a jornada. */
	onAddTask: (prompt: MeetingTaskPrompt) => void;
	/** Formulário do diagnóstico e se a Foto Zero já foi congelada. */
	diagnostic?: { templateId: string | null; done: boolean };
}) {
	const tpl = meeting.template;
	const hasExercise = !!tpl?.exercise_form_template_id;
	// O encontro do diagnóstico é o que usa o formulário do diagnóstico. Sem
	// essa informação (fixtures), cai na regra antiga: encontro 1.
	const isDiagnostic =
		hasExercise &&
		(diagnostic?.templateId
			? tpl?.exercise_form_template_id === diagnostic.templateId
			: meeting.position === 1);
	const diagnosticPending = isDiagnostic && diagnostic?.done === false;
	// Concluir libera o próximo e não tem volta pelo aluno: pede confirmação.
	const [confirming, setConfirming] = useState(false);

	return (
		<div className="max-w-3xl mx-auto space-y-6">
			<MntHeader
				title={`${meeting.position}. ${tpl?.title ?? 'Encontro'}`}
				subtitle={tpl?.subtitle ?? meetingStatusLabel(meeting.status)}
				icon={BookOpen}
				backHref="/course/mentoria/jornada"
			/>

			{meeting.scheduled_at && (
				<p className="-mt-6 inline-flex items-center gap-1.5 text-body text-secondary">
					<CalendarClock className="w-4 h-4 text-brand dark:text-violet-400" />
					{fmtDateTime(meeting.scheduled_at)}
				</p>
			)}

			{meeting.mentor_validated_at && (
				<div className={`${CARD} p-4 flex items-center gap-3`}>
					<BadgeCheck
						className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400"
						aria-hidden
					/>
					<p className="text-body text-secondary">
						Encontro validado pelo mentor.
					</p>
				</div>
			)}

			{meeting.mentor_feedback && (
				<section className={`${CARD} p-5`}>
					{/* `text-brand` é valor de modo claro e o DS não publica versão
					    escura — mesma ressalva de `_components/shared.tsx`. */}
					<p className="mb-2 inline-flex items-center gap-1.5 text-label text-brand dark:text-violet-400">
						<MessageSquareQuote className="w-4 h-4" aria-hidden />
						Feedback do mentor
					</p>
					<p className="text-body text-secondary whitespace-pre-wrap">
						{meeting.mentor_feedback}
					</p>
				</section>
			)}

			{tpl?.objectives && (
				<TemplateSection icon={Target} title="Objetivos">
					{tpl.objectives}
				</TemplateSection>
			)}

			{tpl?.content_md && (
				<TemplateSection icon={BookOpen} title="Conteúdo do encontro">
					<Markdown source={tpl.content_md} />
				</TemplateSection>
			)}

			{tpl?.expected_result && (
				<TemplateSection icon={Flag} title="Resultado esperado">
					{tpl.expected_result}
				</TemplateSection>
			)}

			{tools.length > 0 && (
				<TemplateSection icon={Wrench} title="Ferramentas do encontro">
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
						{tools.map((t) =>
							t.locked ? (
								<div
									key={t.id}
									className="flex items-center justify-between gap-2 rounded-control border border-subtle p-3 opacity-70"
								>
									<span className="text-label text-primary">{t.name}</span>
									<span className="inline-flex shrink-0 items-center gap-1 text-caption text-muted">
										<Lock className="w-3.5 h-3.5" aria-hidden />
										Em breve
									</span>
								</div>
							) : (
								<Link
									key={t.id}
									href={t.href}
									className="flex items-center justify-between gap-2 rounded-control border border-subtle p-3 transition hover:border-brand-border"
								>
									<span className="text-label text-primary">{t.name}</span>
									<ArrowRight
										className="w-4 h-4 shrink-0 text-brand dark:text-violet-400"
										aria-hidden
									/>
								</Link>
							),
						)}
					</div>
				</TemplateSection>
			)}

			{materials.length > 0 && (
				<TemplateSection icon={FileText} title="Materiais">
					<ul className="space-y-2">
						{materials.map((m) => (
							<li key={m.id}>
								<a
									href={m.url}
									target="_blank"
									rel="noreferrer"
									className="flex items-center justify-between gap-2 rounded-control border border-subtle p-3 transition hover:border-brand-border"
								>
									<span className="min-w-0">
										<span className="block truncate text-label text-primary">
											{m.title}
										</span>
										<span className="block truncate text-caption text-muted">
											{m.description || linkLabel(m.url)}
										</span>
									</span>
									<ArrowRight
										className="w-4 h-4 shrink-0 text-brand dark:text-violet-400"
										aria-hidden
									/>
								</a>
							</li>
						))}
					</ul>
				</TemplateSection>
			)}

			<ExerciseSection
				exercise={exercise}
				meeting={meeting}
				isDiagnostic={isDiagnostic}
				diagnosticDone={diagnostic?.done === true}
				meetingTasks={meetingTasks}
				addingTask={addingTask}
				onAddTask={onAddTask}
			/>

			<div
				className={`${CARD} p-4 flex flex-wrap items-center justify-between gap-3`}
			>
				<p className="text-body text-muted">
					{meeting.status === 'done'
						? 'Você concluiu este encontro.'
						: diagnosticPending
							? 'Envie o diagnóstico antes de concluir: ele é o exercício deste encontro.'
							: 'Concluiu as atividades? Marque o encontro como concluído.'}
				</p>
				{canComplete && (
					// Ícone + texto é um ARRAY de children, e array bypassa o wrap
					// automático do Button em <Text> — o texto cru quebraria em runtime.
					// Daí o <Text> explícito; `buttonLabel` veste só ele.
					<Button
						variant="primary"
						onPress={() => setConfirming(true)}
						disabled={completing}
					>
						<CheckCircle2 className="h-4 w-4 text-on-brand" aria-hidden />
						<Text className={buttonLabel({ variant: 'primary' })}>
							{completing ? 'Concluindo...' : 'Concluir encontro'}
						</Text>
					</Button>
				)}
			</div>

			{nextMeeting && <NextMeetingCard meeting={nextMeeting} />}

			{confirming && (
				<ConfirmDialog
					title="Concluir encontro?"
					confirmLabel="Concluir"
					busy={completing}
					onCancel={() => setConfirming(false)}
					onConfirm={() => {
						setConfirming(false);
						onComplete();
					}}
				>
					{diagnosticPending
						? 'O diagnóstico ainda não foi enviado.'
						: 'O próximo encontro será liberado.'}
				</ConfirmDialog>
			)}
		</div>
	);
}

/** Atalho para o encontro seguinte (bloqueado vira só o cartaz). */
function NextMeetingCard({ meeting }: { meeting: MntJourneyMeeting }) {
	const locked = meeting.status === 'locked';
	const body = (
		<div className="min-w-0">
			<p className="text-caption uppercase tracking-wide text-muted">
				Próximo encontro
			</p>
			<p className="truncate text-label text-primary">
				{meeting.position}. {meeting.template?.title ?? 'Encontro'}
			</p>
			<p className="text-caption text-muted">
				{meeting.scheduled_at
					? fmtDateTime(meeting.scheduled_at)
					: locked
						? 'Libera ao concluir este'
						: meetingStatusLabel(meeting.status)}
			</p>
		</div>
	);
	return locked ? (
		<div className={`${CARD} flex items-center justify-between gap-3 p-4`}>
			{body}
			<Lock className="w-4 h-4 shrink-0 text-muted" aria-hidden />
		</div>
	) : (
		<Link
			href={`/course/mentoria/jornada/${meeting.id}`}
			className={`${CARD} flex items-center justify-between gap-3 p-4 transition hover:border-brand-border`}
		>
			{body}
			<ArrowRight
				className="w-4 h-4 shrink-0 text-brand dark:text-violet-400"
				aria-hidden
			/>
		</Link>
	);
}

/** Bloco de texto corrido vindo do template do encontro. */
function TemplateSection({
	icon: Icon,
	title,
	children,
}: {
	icon: typeof Target;
	title: string;
	children: ReactNode;
}) {
	return (
		<section className={`${CARD} p-5`}>
			<h2 className="mb-2 inline-flex items-center gap-2 text-title text-primary">
				<Icon className="w-4 h-4 text-brand dark:text-violet-400" aria-hidden />
				{title}
			</h2>
			{typeof children === 'string' ? (
				<p className="text-body text-secondary whitespace-pre-wrap leading-relaxed">
					{children}
				</p>
			) : (
				children
			)}
		</section>
	);
}

function ExerciseSection({
	exercise,
	meeting,
	isDiagnostic,
	diagnosticDone,
	meetingTasks,
	addingTask,
	onAddTask,
}: {
	meeting: MntJourneyMeeting;
	isDiagnostic: boolean;
	diagnosticDone: boolean;
	meetingTasks: MntTask[];
	addingTask: boolean;
	onAddTask: (prompt: MeetingTaskPrompt) => void;
	exercise?: ReactNode;
}) {
	const tpl = meeting.template;
	const prompts: MeetingTaskPrompt[] = tpl?.task_prompts ?? [];

	const hasExercise = !!tpl?.exercise_form_template_id;

	if (!hasExercise && prompts.length === 0) return null;

	return (
		<section className={`${CARD} p-5`}>
			<h2 className="mb-3 inline-flex items-center gap-2 text-title text-primary">
				<ListChecks
					className="w-4 h-4 text-brand dark:text-violet-400"
					aria-hidden
				/>
				Exercício do encontro
			</h2>

			{isDiagnostic && (
				<div className="mb-4 rounded-control border border-subtle bg-brand-wash p-4">
					<p className="mb-3 text-body text-secondary">
						{diagnosticDone
							? 'Diagnóstico enviado: sua Foto Zero está congelada.'
							: 'O exercício deste encontro é o Raio-X inicial da sua empresa — o diagnóstico que vira a sua Foto Zero.'}
					</p>
					{/* Continua `<Link>` com as classes do botão: o `Button` do DS não
					    navega, e trocar por `onPress` + router perderia o clique do meio. */}
					<Link href="/course/mentoria/diagnostico" className={BTN_PRIMARY}>
						<ClipboardList className="w-4 h-4" aria-hidden />
						{diagnosticDone ? 'Ver Foto Zero' : 'Fazer o diagnóstico'}
					</Link>
				</div>
			)}

			{hasExercise && !isDiagnostic && (
				<div className="mb-4">
					{exercise ?? (
						<p className="text-body text-muted">
							O exercício deste encontro é feito junto com o mentor.
						</p>
					)}
				</div>
			)}

			{prompts.length > 0 && (
				<div className="space-y-2">
					<p className="text-caption uppercase tracking-wide text-secondary">
						Tarefas sugeridas
					</p>
					{prompts.map((p) => {
						// TODO: dívida herdada — compara título em string porque a tarefa
						// criada não guarda referência ao prompt de origem. Dois prompts
						// com o mesmo título se confundem.
						const alreadyAdded = meetingTasks.some((t) => t.title === p.title);
						return (
							<div
								key={p.title}
								className="flex items-start justify-between gap-3 rounded-control border border-subtle p-3"
							>
								<div className="min-w-0">
									<p className="text-label text-primary">{p.title}</p>
									{p.description && (
										<p className="mt-0.5 text-caption text-muted">
											{p.description}
										</p>
									)}
								</div>
								{alreadyAdded ? (
									<span className="shrink-0 inline-flex items-center gap-1 text-caption text-emerald-600 dark:text-emerald-400">
										<CheckCircle2 className="w-3.5 h-3.5" aria-hidden />
										Adicionada
									</span>
								) : (
									<div className="shrink-0">
										<Button
											variant="secondary"
											onPress={() => onAddTask(p)}
											disabled={addingTask}
											accessibilityLabel={`Adicionar tarefa: ${p.title}`}
										>
											<Plus className="h-3.5 w-3.5 text-primary" aria-hidden />
											<Text className={buttonLabel({ variant: 'secondary' })}>
												Adicionar
											</Text>
										</Button>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</section>
	);
}
