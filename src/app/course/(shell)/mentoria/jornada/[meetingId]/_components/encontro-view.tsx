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
import { Text } from 'react-native-css/components/Text';
import type {
	MeetingTaskPrompt,
	MntJourneyMeeting,
	MntTask,
} from '@/modules/mentoria/types';
import {
	BTN_PRIMARY,
	CARD,
	MntHeader,
	meetingStatusLabel,
} from '../../../_components/shared';

export function EncontroView({
	meeting,
	meetingTasks,
	canComplete,
	completing,
	onComplete,
	addingTask,
	onAddTask,
}: {
	meeting: MntJourneyMeeting;
	/** Tarefas já filtradas pela origem deste encontro. */
	meetingTasks: MntTask[];
	canComplete: boolean;
	completing: boolean;
	onComplete: () => void;
	addingTask: boolean;
	/** O container monta o corpo da tarefa: só ele conhece a origem e a jornada. */
	onAddTask: (prompt: MeetingTaskPrompt) => void;
}) {
	const tpl = meeting.template;

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
					{tpl.content_md}
				</TemplateSection>
			)}

			{tpl?.expected_result && (
				<TemplateSection icon={Flag} title="Resultado esperado">
					{tpl.expected_result}
				</TemplateSection>
			)}

			<ExerciseSection
				meeting={meeting}
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
						: 'Concluiu as atividades? Marque o encontro como concluído.'}
				</p>
				{canComplete && (
					// Ícone + texto é um ARRAY de children, e array bypassa o wrap
					// automático do Button em <Text> — o texto cru quebraria em runtime.
					// Daí o <Text> explícito; `buttonLabel` veste só ele.
					<Button variant="primary" onPress={onComplete} disabled={completing}>
						<CheckCircle2 className="h-4 w-4 text-on-brand" aria-hidden />
						<Text className={buttonLabel({ variant: 'primary' })}>
							{completing ? 'Concluindo...' : 'Concluir encontro'}
						</Text>
					</Button>
				)}
			</div>
		</div>
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
	children: string;
}) {
	return (
		<section className={`${CARD} p-5`}>
			<h2 className="mb-2 inline-flex items-center gap-2 text-title text-primary">
				<Icon className="w-4 h-4 text-brand dark:text-violet-400" aria-hidden />
				{title}
			</h2>
			<p className="text-body text-secondary whitespace-pre-wrap leading-relaxed">
				{children}
			</p>
		</section>
	);
}

function ExerciseSection({
	meeting,
	meetingTasks,
	addingTask,
	onAddTask,
}: {
	meeting: MntJourneyMeeting;
	meetingTasks: MntTask[];
	addingTask: boolean;
	onAddTask: (prompt: MeetingTaskPrompt) => void;
}) {
	const tpl = meeting.template;
	const prompts: MeetingTaskPrompt[] = tpl?.task_prompts ?? [];

	const hasExercise = !!tpl?.exercise_form_template_id;
	// TODO: dívida herdada — assume que o encontro 1 é sempre o Raio-X inicial.
	// O certo seria o template dizer qual formulário é o diagnóstico, em vez de
	// deduzir pela posição.
	const isDiagnostic = hasExercise && meeting.position === 1;

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
						O exercício deste encontro é o <strong>Raio-X inicial</strong> da
						sua empresa — o diagnóstico que vira a sua Foto Zero.
					</p>
					{/* Continua `<Link>` com as classes do botão: o `Button` do DS não
					    navega, e trocar por `onPress` + router perderia o clique do meio. */}
					<Link href="/course/mentoria/diagnostico" className={BTN_PRIMARY}>
						<ClipboardList className="w-4 h-4" aria-hidden />
						Fazer o diagnóstico
					</Link>
				</div>
			)}

			{hasExercise && !isDiagnostic && (
				<p className="mb-4 text-body text-muted">
					O exercício prático deste encontro é feito junto com o mentor. As
					tarefas sugeridas abaixo ajudam a colocá-lo em prática.
				</p>
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
