'use client';

// Container da linha do tempo da Jornada: gates de acesso, consulta dos
// encontros e ordenação. A apresentação mora em `_components/jornada-view.tsx`,
// que a rota de conferência (`app/(dev)/mentoria-jornada-check`) renderiza com
// fixtures — mesmo padrão de `indicadores/page.tsx`.

import { SubscriptionGate } from '@/components/course/subscription-gate';
import { useJourneyMeetings } from '@/modules/mentoria/hooks';
import { JourneyGate, MntSkeleton } from '../_components/shared';
import { JornadaView } from './_components/jornada-view';

export default function JornadaMentoriaPage() {
	return (
		<SubscriptionGate toolKey="mentoria_360">
			<JourneyGate>
				{({ journeyId }) => <JornadaContent journeyId={journeyId} />}
			</JourneyGate>
		</SubscriptionGate>
	);
}

function JornadaContent({ journeyId }: { journeyId: string }) {
	const { data: meetings, isLoading } = useJourneyMeetings(journeyId);

	if (isLoading) return <MntSkeleton />;

	// A API não garante a ordem; a linha do tempo depende dela.
	const ordered = [...(meetings ?? [])].sort((a, b) => a.position - b.position);

	return <JornadaView meetings={ordered} />;
}
