'use client';

// Container das lives da turma: gate de acesso e consulta. A apresentação mora
// em `_components/lives-view.tsx`, que a rota de conferência
// (`app/(dev)/mentoria-lives-check`) renderiza com fixtures — mesmo padrão de
// `tarefas/page.tsx`.

import { SubscriptionGate } from '@/components/course/subscription-gate';
import { useMyLives } from '@/modules/mentoria/hooks';
import { JourneyGate, MntSkeleton } from '../_components/shared';
import { LivesView } from './_components/lives-view';

export default function LivesPage() {
	return (
		<SubscriptionGate toolKey="mentoria_360">
			<JourneyGate>{() => <Content />}</JourneyGate>
		</SubscriptionGate>
	);
}

function Content() {
	const { data: lives, isLoading } = useMyLives();

	if (isLoading) return <MntSkeleton />;

	return <LivesView lives={lives ?? []} />;
}
