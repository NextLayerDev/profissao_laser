'use client';

// Container do detalhe de uma live: gate de acesso, consulta da sala e do token
// de playback. A apresentação mora em `_components/live-view.tsx`, que a rota
// de conferência (`app/(dev)/mentoria-lives-check`) renderiza com fixtures.

import { useParams } from 'next/navigation';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import { useLive, useLivePlayback } from '@/modules/mentoria/hooks';
import { JourneyGate, MntSkeleton } from '../../_components/shared';
import type { PlaybackState } from './_components/live-view';
import { LiveNotFound, LiveView } from './_components/live-view';

export default function LiveDetailPage() {
	const params = useParams<{ liveId: string }>();
	return (
		<SubscriptionGate toolKey="mentoria_360">
			<JourneyGate>{() => <Content liveId={params.liveId} />}</JourneyGate>
		</SubscriptionGate>
	);
}

function Content({ liveId }: { liveId: string }) {
	const { data: live, isLoading, isError } = useLive(liveId);
	const playable = live?.status === 'active' || live?.status === 'vod_ready';
	const { data: playback } = useLivePlayback(liveId, Boolean(playable));

	if (isLoading) return <MntSkeleton />;

	// "Carregando" e "não existe" eram o mesmo `MntSkeleton`, então um id
	// inválido na URL girava o esqueleto para sempre.
	if (isError || !live) return <LiveNotFound />;

	// A view não refaz a regra: só o container sabe se o token de playback já
	// chegou (o `useLivePlayback` só roda quando a sala é tocável).
	const playbackState: PlaybackState =
		playable && playback
			? 'playing'
			: live.status === 'ended'
				? 'ended'
				: 'waiting';

	return (
		<LiveView
			live={live}
			playback={playback ?? null}
			playbackState={playbackState}
		/>
	);
}
