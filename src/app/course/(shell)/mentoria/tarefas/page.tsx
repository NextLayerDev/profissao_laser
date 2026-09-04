'use client';

// Container de "Minhas tarefas": gate de acesso, consulta e mutações. A
// apresentação mora em `_components/tarefas-view.tsx`, que a rota de
// conferência (`app/(dev)/mentoria-tarefas-check`) renderiza com fixtures —
// mesmo padrão de `jornada/page.tsx`.

import { toast } from 'sonner';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import { useTaskMutations, useTasks } from '@/modules/mentoria/hooks';
import type { TaskStatus } from '@/modules/mentoria/types';
import { JourneyGate, MntSkeleton } from '../_components/shared';
import type { NewTaskInput } from './_components/tarefas-view';
import { TarefasView } from './_components/tarefas-view';

export default function TarefasPage() {
	return (
		<SubscriptionGate toolKey="mentoria_360">
			<JourneyGate>
				{({ journeyId }) => <Content journeyId={journeyId} />}
			</JourneyGate>
		</SubscriptionGate>
	);
}

function Content({ journeyId }: { journeyId: string }) {
	const { data: tasks, isLoading } = useTasks(journeyId);
	const { create, update, uploadEvidence, addLink } =
		useTaskMutations(journeyId);

	if (isLoading) return <MntSkeleton />;

	const handleCreate = (input: NewTaskInput) => {
		if (!input.title.trim()) {
			toast.error('Dê um título à tarefa.');
			return;
		}
		create.mutate(input, {
			onSuccess: () => toast.success('Tarefa criada!'),
			onError: () => toast.error('Não foi possível criar a tarefa.'),
		});
	};

	const handleStatusChange = (taskId: string, status: TaskStatus) => {
		update.mutate({ taskId, body: { status } });
	};

	const handleUpload = (taskId: string, file: File) => {
		uploadEvidence.mutate(
			{ taskId, file },
			{
				onSuccess: () => toast.success('Evidência anexada!'),
				onError: () => toast.error('Falha ao anexar evidência.'),
			},
		);
	};

	const handleAddLink = (taskId: string, url: string) => {
		addLink.mutate(
			{ taskId, url },
			{
				onSuccess: () => toast.success('Link anexado!'),
				onError: () => toast.error('Falha ao anexar link.'),
			},
		);
	};

	return (
		<TarefasView
			tasks={tasks ?? []}
			creating={create.isPending}
			updatingTaskId={
				update.isPending ? (update.variables?.taskId ?? null) : null
			}
			uploadingTaskId={
				uploadEvidence.isPending
					? (uploadEvidence.variables?.taskId ?? null)
					: null
			}
			addingLinkTaskId={
				addLink.isPending ? (addLink.variables?.taskId ?? null) : null
			}
			onCreate={handleCreate}
			onStatusChange={handleStatusChange}
			onUpload={handleUpload}
			onAddLink={handleAddLink}
		/>
	);
}
