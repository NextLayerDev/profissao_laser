'use client';

import { CalendarClock, PlaySquare, Radio, Video } from 'lucide-react';
import Link from 'next/link';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import { useMyLives } from '@/modules/mentoria/hooks';
import type { MntLiveRoom } from '@/modules/mentoria/types';
import {
	CARD,
	EmptyState,
	JourneyGate,
	MntHeader,
	MntSkeleton,
} from '../_components/shared';

export default function LivesPage() {
	return (
		<SubscriptionGate toolKey="mentoria_360">
			<JourneyGate>{() => <Content />}</JourneyGate>
		</SubscriptionGate>
	);
}

function fmtDateTime(iso: string | null): string {
	if (!iso) return 'Data a definir';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return 'Data a definir';
	return d.toLocaleString('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function Content() {
	const { data: lives, isLoading } = useMyLives();

	if (isLoading) return <MntSkeleton />;

	const active = (lives ?? []).filter((l) => l.status === 'active');
	const scheduled = (lives ?? []).filter((l) => l.status === 'idle');
	const vods = (lives ?? []).filter((l) => l.status === 'vod_ready');

	return (
		<div className="p-4 md:p-8 max-w-5xl mx-auto">
			<MntHeader
				title="Lives da mentoria"
				subtitle="Transmissões fechadas para a sua turma — ao vivo e gravações"
				icon={Video}
				backHref="/course/mentoria"
			/>

			{(lives ?? []).length === 0 ? (
				<EmptyState
					icon={Video}
					title="Nenhuma live por enquanto"
					description="Quando o mentor agendar uma transmissão, ela aparece aqui."
				/>
			) : (
				<div className="space-y-8">
					{active.length > 0 && (
						<Section title="Ao vivo agora" Icon={Radio}>
							{active.map((live) => (
								<LiveCard key={live.id} live={live} highlight />
							))}
						</Section>
					)}
					{scheduled.length > 0 && (
						<Section title="Agendadas" Icon={CalendarClock}>
							{scheduled.map((live) => (
								<LiveCard key={live.id} live={live} />
							))}
						</Section>
					)}
					{vods.length > 0 && (
						<Section title="Gravações" Icon={PlaySquare}>
							{vods.map((live) => (
								<LiveCard key={live.id} live={live} />
							))}
						</Section>
					)}
				</div>
			)}
		</div>
	);
}

function Section({
	title,
	Icon,
	children,
}: {
	title: string;
	Icon: React.ComponentType<{ className?: string }>;
	children: React.ReactNode;
}) {
	return (
		<section>
			<h3 className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-3">
				<Icon className="w-4 h-4" />
				{title}
			</h3>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
		</section>
	);
}

function LiveCard({
	live,
	highlight = false,
}: {
	live: MntLiveRoom;
	highlight?: boolean;
}) {
	return (
		<Link
			href={`/course/mentoria/lives/${live.id}`}
			className={`${CARD} p-4 hover:border-teal-500/40 transition block ${
				highlight ? 'ring-1 ring-red-500/40' : ''
			}`}
		>
			<div className="flex items-center gap-2 mb-1.5">
				{live.status === 'active' && (
					<span className="inline-flex items-center gap-1 rounded-full bg-red-600 text-white text-[10px] font-semibold px-2 py-0.5 animate-pulse">
						<Radio className="w-3 h-3" />
						AO VIVO
					</span>
				)}
				{live.status === 'vod_ready' && (
					<span className="rounded-full bg-slate-500/15 text-slate-500 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5">
						GRAVAÇÃO
					</span>
				)}
				<p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
					{live.title}
				</p>
			</div>
			{live.description && (
				<p className="text-sm text-slate-500 dark:text-gray-400 line-clamp-2 mb-1.5">
					{live.description}
				</p>
			)}
			<p className="text-xs text-slate-400">
				{live.status === 'idle'
					? fmtDateTime(live.scheduled_at)
					: fmtDateTime(live.started_at ?? live.scheduled_at)}
			</p>
		</Link>
	);
}
