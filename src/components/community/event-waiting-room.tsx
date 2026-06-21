'use client';

import {
	AlertCircle,
	ChevronLeft,
	Clock,
	Loader2,
	Lock,
	LogOut,
	Tv,
	Video,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { EventPresenceList } from '@/components/community/event-presence-list';
import {
	useEventPresenceRealtime,
	useEventWaitingRoom,
	useJoinWaitingRoom,
	useLeaveWaitingRoom,
} from '@/hooks/use-event-waiting-room';

interface EventWaitingRoomProps {
	eventId: string;
}

const TYPE_LABEL: Record<string, string> = {
	live: 'Ao vivo',
	workshop: 'Workshop',
	qa: 'Q&A',
};

function parseYouTubeEmbed(url: string): string | null {
	// Aceita: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/live/ID
	const match = url.match(
		/(?:youtube\.com\/(?:watch\?v=|live\/|embed\/)|youtu\.be\/)([\w-]{11})/,
	);
	if (!match) return null;
	return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
}

function parseVimeoEmbed(url: string): string | null {
	const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
	if (!match) return null;
	return `https://player.vimeo.com/video/${match[1]}?autoplay=1`;
}

function embedUrlFor(
	provider: 'youtube' | 'vimeo' | null | undefined,
	url: string | null | undefined,
): string | null {
	if (!url) return null;
	if (provider === 'youtube') return parseYouTubeEmbed(url);
	if (provider === 'vimeo') return parseVimeoEmbed(url);
	// Auto-detect se admin não setou o provider
	return parseYouTubeEmbed(url) ?? parseVimeoEmbed(url);
}

function useCountdown(targetIso: string | undefined): {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
	totalMs: number;
} {
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		const interval = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(interval);
	}, []);

	if (!targetIso) {
		return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
	}
	const totalMs = Math.max(0, new Date(targetIso).getTime() - now);
	const totalSec = Math.floor(totalMs / 1000);
	return {
		days: Math.floor(totalSec / 86400),
		hours: Math.floor((totalSec % 86400) / 3600),
		minutes: Math.floor((totalSec % 3600) / 60),
		seconds: totalSec % 60,
		totalMs,
	};
}

function CountdownDisplay({
	days,
	hours,
	minutes,
	seconds,
	size = 'lg',
}: {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
	size?: 'sm' | 'lg';
}) {
	const cellClass =
		size === 'lg'
			? 'min-w-[80px] px-4 py-3 text-3xl md:text-4xl'
			: 'min-w-[64px] px-3 py-2 text-xl';
	return (
		<div className="flex items-center gap-2 md:gap-3">
			{days > 0 && (
				<>
					<CountdownCell value={days} label="dias" cellClass={cellClass} />
					<span className="text-slate-400 dark:text-gray-500 text-2xl font-bold">
						:
					</span>
				</>
			)}
			<CountdownCell value={hours} label="horas" cellClass={cellClass} />
			<span className="text-slate-400 dark:text-gray-500 text-2xl font-bold">
				:
			</span>
			<CountdownCell value={minutes} label="min" cellClass={cellClass} />
			<span className="text-slate-400 dark:text-gray-500 text-2xl font-bold">
				:
			</span>
			<CountdownCell value={seconds} label="seg" cellClass={cellClass} />
		</div>
	);
}

function CountdownCell({
	value,
	label,
	cellClass,
}: {
	value: number;
	label: string;
	cellClass: string;
}) {
	return (
		<div className="flex flex-col items-center">
			<div
				className={`rounded-xl bg-linear-to-br from-violet-600 to-fuchsia-600 text-white font-bold flex items-center justify-center tabular-nums ${cellClass}`}
			>
				{String(value).padStart(2, '0')}
			</div>
			<span className="text-xs text-slate-500 dark:text-gray-400 mt-1">
				{label}
			</span>
		</div>
	);
}

export function EventWaitingRoom({ eventId }: EventWaitingRoomProps) {
	const { data, isLoading, error } = useEventWaitingRoom(eventId);
	const joinMut = useJoinWaitingRoom(eventId);
	const leaveMut = useLeaveWaitingRoom(eventId);

	// Realtime: invalida query quando presença muda
	useEventPresenceRealtime(eventId);

	// Auto-join ao abrir a página (uma vez quando carrega + sala aberta + ainda não está dentro)
	const shouldAutoJoin =
		!!data && data.isWaitingRoomOpen && !data.hasJoined && !joinMut.isPending;
	useEffect(() => {
		if (shouldAutoJoin) {
			joinMut.mutate();
		}
	}, [shouldAutoJoin, joinMut]);

	// Leave ao desmontar (sair da página). Usa refs pra ler valores atuais no
	// momento do unmount sem refazer o efeito a cada mudança.
	const hasJoinedRef = useRef(false);
	const leaveMutRef = useRef(leaveMut);
	hasJoinedRef.current = data?.hasJoined ?? false;
	leaveMutRef.current = leaveMut;
	useEffect(() => {
		return () => {
			if (hasJoinedRef.current) {
				leaveMutRef.current.mutate();
			}
		};
	}, []);

	const countdownToOpen = useCountdown(data?.waitingRoomOpensAt);
	const countdownToLive = useCountdown(data?.startsAt);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
			</div>
		);
	}

	if (error || !data) {
		// Acesso direto à URL sem o plano: backend devolve 403 plan_not_allowed.
		const planBlocked =
			!!error &&
			typeof error === 'object' &&
			'response' in error &&
			(
				error as {
					response?: { status?: number; data?: { message?: string } };
				}
			).response?.status === 403 &&
			(error as { response?: { data?: { message?: string } } }).response?.data
				?.message === 'plan_not_allowed';

		if (planBlocked) {
			return (
				<div className="rounded-2xl border border-amber-300/60 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-8 text-center">
					<Lock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
					<h3 className="font-semibold text-slate-900 dark:text-white mb-1">
						Seu plano não dá acesso a esta live
					</h3>
					<p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
						Faça upgrade do seu plano para participar das mentorias exclusivas.
					</p>
					<Link
						href="/course/store"
						className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold rounded-lg transition-colors"
					>
						<Lock className="w-4 h-4" />
						Ver planos
					</Link>
				</div>
			);
		}

		return (
			<div className="rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/20 p-8 text-center">
				<AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
				<h3 className="font-semibold text-slate-900 dark:text-white mb-1">
					Evento não encontrado
				</h3>
				<p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
					Verifique o link ou volte para a lista de eventos.
				</p>
				<Link
					href="/course/eventos"
					className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors"
				>
					<ChevronLeft className="w-4 h-4" />
					Voltar
				</Link>
			</div>
		);
	}

	const { event, isWaitingRoomOpen, isLive, hasEnded, attendees, hasJoined } =
		data;
	const embedUrl = embedUrlFor(event.streamProvider, event.streamUrl);
	const typeLabel = TYPE_LABEL[event.type] ?? event.type;

	// ── Estado D: encerrado ──────────────────────────────────────────────
	if (hasEnded) {
		return (
			<div className="space-y-4">
				<BackLink />
				<div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-8 text-center">
					<Tv className="w-12 h-12 text-slate-400 mx-auto mb-3" />
					<h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-2">
						Evento encerrado
					</h2>
					<p className="text-slate-600 dark:text-gray-400 mb-4">
						{event.title}
					</p>
					{embedUrl && (
						<a
							href={event.streamUrl ?? '#'}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors"
						>
							<Video className="w-4 h-4" />
							Ver replay
						</a>
					)}
				</div>
			</div>
		);
	}

	// ── Estado C: live em andamento → player embed + presença ─────────────
	if (isLive) {
		return (
			<div className="space-y-4">
				<BackLink />
				<EventHeader event={event} typeLabel={typeLabel} />
				<div className="grid gap-4 lg:grid-cols-[1fr_320px]">
					<div className="space-y-3">
						{embedUrl ? (
							<div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-black">
								<iframe
									src={embedUrl}
									title={event.title}
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
									allowFullScreen
									className="w-full h-full"
								/>
							</div>
						) : (
							<NoStreamFallback />
						)}
						{hasJoined && (
							<button
								type="button"
								onClick={() => leaveMut.mutate()}
								disabled={leaveMut.isPending}
								className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
							>
								<LogOut className="w-4 h-4" />
								Sair da sala
							</button>
						)}
					</div>
					<EventPresenceList attendees={attendees} />
				</div>
			</div>
		);
	}

	// ── Estado B: sala aberta, antes da live → countdown pequeno + presença
	if (isWaitingRoomOpen) {
		return (
			<div className="space-y-4">
				<BackLink />
				<EventHeader event={event} typeLabel={typeLabel} />
				<div className="grid gap-4 lg:grid-cols-[1fr_320px]">
					<div className="rounded-2xl border border-violet-200 dark:border-violet-800/40 bg-linear-to-br from-violet-50 via-white to-fuchsia-50 dark:from-violet-950/30 dark:via-[#1a1a1d] dark:to-fuchsia-950/20 p-8 text-center">
						<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-medium mb-4">
							<Clock className="w-3 h-3" />
							Sala aberta — live começa em
						</div>
						<div className="flex justify-center mb-6">
							<CountdownDisplay
								days={countdownToLive.days}
								hours={countdownToLive.hours}
								minutes={countdownToLive.minutes}
								seconds={countdownToLive.seconds}
							/>
						</div>
						<p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
							{attendees.length === 0
								? 'Seja a primeira pessoa na sala.'
								: `${attendees.length} ${attendees.length === 1 ? 'pessoa esperando' : 'pessoas esperando'}`}
						</p>
						{hasJoined && (
							<button
								type="button"
								onClick={() => leaveMut.mutate()}
								disabled={leaveMut.isPending}
								className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
							>
								<LogOut className="w-4 h-4" />
								Sair da sala
							</button>
						)}
					</div>
					<EventPresenceList attendees={attendees} />
				</div>
			</div>
		);
	}

	// ── Estado A: sala ainda fechada → countdown grande até abrir ────────
	return (
		<div className="space-y-4">
			<BackLink />
			<EventHeader event={event} typeLabel={typeLabel} />
			<div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-linear-to-br from-violet-50 via-white to-fuchsia-50 dark:from-violet-950/30 dark:via-[#1a1a1d] dark:to-fuchsia-950/20 p-10 text-center">
				<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-gray-300 text-xs font-medium mb-6">
					<Clock className="w-3 h-3" />
					Sala de espera abre em
				</div>
				<div className="flex justify-center mb-4">
					<CountdownDisplay
						days={countdownToOpen.days}
						hours={countdownToOpen.hours}
						minutes={countdownToOpen.minutes}
						seconds={countdownToOpen.seconds}
					/>
				</div>
				<p className="text-sm text-slate-500 dark:text-gray-400">
					Volte aqui um pouco antes do horário pra entrar.
				</p>
			</div>
		</div>
	);
}

function BackLink() {
	return (
		<Link
			href="/course/eventos"
			className="inline-flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 hover:underline"
		>
			<ChevronLeft className="w-3.5 h-3.5" />
			Voltar aos eventos
		</Link>
	);
}

function EventHeader({
	event,
	typeLabel,
}: {
	event: {
		title: string;
		date: string;
		time?: string | null;
		description?: string | null;
	};
	typeLabel: string;
}) {
	const dateFmt = new Date(`${event.date}T00:00:00`).toLocaleDateString(
		'pt-BR',
		{
			weekday: 'long',
			day: '2-digit',
			month: 'long',
		},
	);
	return (
		<div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-5">
			<div className="flex items-start justify-between gap-4 flex-wrap">
				<div className="min-w-0">
					<span className="inline-block px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-medium mb-2">
						{typeLabel}
					</span>
					<h1 className="font-display text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
						{event.title}
					</h1>
					{event.description && (
						<p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
							{event.description}
						</p>
					)}
				</div>
				<div className="text-right shrink-0">
					<p className="text-sm text-slate-500 dark:text-gray-400 capitalize">
						{dateFmt}
					</p>
					<p className="text-lg font-bold text-slate-900 dark:text-white">
						{event.time ?? '—'}
					</p>
				</div>
			</div>
		</div>
	);
}

function NoStreamFallback() {
	return (
		<div className="aspect-video w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1a1a1d] flex items-center justify-center text-center p-8">
			<div>
				<Tv className="w-12 h-12 text-slate-400 mx-auto mb-2" />
				<h3 className="font-semibold text-slate-900 dark:text-white mb-1">
					Link da live em breve
				</h3>
				<p className="text-sm text-slate-500 dark:text-gray-400">
					O host ainda não configurou o link da transmissão.
				</p>
			</div>
		</div>
	);
}
