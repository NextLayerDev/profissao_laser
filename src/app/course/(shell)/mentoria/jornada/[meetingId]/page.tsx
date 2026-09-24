'use client';

// Container do detalhe de um encontro: gates de acesso, consultas, mutações e
// os dois estados de guarda (encontro inexistente e encontro bloqueado). A
// apresentação mora em `_components/encontro-view.tsx`, que a rota de
// conferência (`app/(dev)/mentoria-jornada-check`) renderiza com fixtures.

import { BookOpen } from 'lucide-react';
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
import type { MeetingTaskPrompt } from '@/modules/mentoria/types';
import {
	BTN_GHOST,
	EmptyState,
	JourneyGate,
	MntHeader,
	MntSkeleton,
} from '../../_components/shared';
import { EncontroView } from './_components/encontro-view';

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
	// Mesma queryKey da linha do tempo: quem chega pela lista já tem o encontro
	// em cache, então não existe endpoint de encontro isolado a chamar.
	const { data: meetings, isLoading } = useJourneyMeetings(journeyId);
	const complete = useCompleteMeeting(journeyId);
	const { data: tasks } = useTasks(journeyId);
	const { create } = useTaskMutations(journeyId);

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

	// Barra o acesso direto por URL a um encontro que a lista nem deixa clicar.
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

	const meetingTasks = (tasks ?? []).filter(
		(t) => t.origin_type === 'meeting' && t.origin_id === meeting.id,
	);

	const canComplete =
		meeting.status === 'available' || meeting.status === 'in_progress';

	const handleComplete = () => {
		complete.mutate(meeting.id, {
			onSuccess: () => toast.success('Encontro concluído! Bom trabalho.'),
			onError: () => toast.error('Não foi possível concluir o encontro.'),
		});
	};

	const handleAddTask = (prompt: MeetingTaskPrompt) => {
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

	return (
		<EncontroView
			meeting={meeting}
			meetingTasks={meetingTasks}
			canComplete={canComplete}
			completing={complete.isPending}
			onComplete={handleComplete}
			addingTask={create.isPending}
			onAddTask={handleAddTask}
		/>
	);
}
