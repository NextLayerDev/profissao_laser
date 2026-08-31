'use client';

import { Hourglass, Video } from 'lucide-react';
import { useParams } from 'next/navigation';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import { LiveChat } from '@/modules/mentoria/components/live-chat';
import { LivePlayer } from '@/modules/mentoria/components/live-player';
import { useLive, useLivePlayback } from '@/modules/mentoria/hooks';
import {
	CARD,
	JourneyGate,
	MntHeader,
	MntSkeleton,
} from '../../_components/shared';

export default function LiveDetailPage() {
	const params = useParams<{ liveId: string }>();
	return (
		<SubscriptionGate toolKey="mentoria_360">
			<JourneyGate>{() => <Content liveId={params.liveId} />}</JourneyGate>
		</SubscriptionGate>
	);
}

function Content({ liveId }: { liveId: string }) {
	const { data: live, isLoading } = useLive(liveId);
	const playable = live?.status === 'active' || live?.status === 'vod_ready';
	const { data: playback } = useLivePlayback(liveId, Boolean(playable));

	if (isLoading || !live) return <MntSkeleton />;

	return (
		<div className="p-4 md:p-8 max-w-6xl mx-auto">
			<MntHeader
				title={live.title}
				subtitle={live.description ?? undefined}
				icon={Video}
				backHref="/course/mentoria/lives"
			/>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2">
					{playable && playback ? (
						<LivePlayer playback={playback} />
					) : live.status === 'ended' ? (
						<Waiting
							title="Live encerrada"
							description="A gravação está sendo processada e aparece aqui em alguns minutos."
						/>
					) : (
						<Waiting
							title="Aguardando transmissão"
							description="Quando o mentor iniciar a live, o player abre automaticamente."
						/>
					)}
				</div>
				<div className="h-105 lg:h-auto">
					<LiveChat liveId={liveId} />
				</div>
			</div>
		</div>
	);
}

function Waiting({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<div
			className={`${CARD} aspect-video flex flex-col items-center justify-center text-center px-6`}
		>
			<Hourglass className="w-8 h-8 text-teal-500 mb-3 animate-pulse" />
			<p className="font-semibold text-slate-900 dark:text-slate-100">
				{title}
			</p>
			<p className="text-sm text-slate-500 dark:text-gray-400 mt-1 max-w-sm">
				{description}
			</p>
		</div>
	);
}
