'use client';

import {
	BadgeCheck,
	Check,
	Compass,
	Lock,
	MessageSquareQuote,
	Play,
} from 'lucide-react';
import Link from 'next/link';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import { useJourneyMeetings } from '@/modules/mentoria/hooks';
import type { MntJourneyMeeting } from '@/modules/mentoria/types';
import {
	CARD,
	EmptyState,
	fmtDate,
	JourneyGate,
	MntHeader,
	MntSkeleton,
	meetingStatusLabel,
} from '../_components/shared';

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

	const ordered = [...(meetings ?? [])].sort((a, b) => a.position - b.position);

	return (
		<div className="p-4 md:p-8 max-w-3xl mx-auto">
			<MntHeader
				title="Jornada da Mentoria"
				subtitle="10 encontros para enxergar sua empresa por inteiro"
				icon={Compass}
				backHref="/course/mentoria"
			/>

			{ordered.length === 0 ? (
				<EmptyState
					title="Nenhum encontro na sua jornada ainda"
					description="Os encontros aparecem aqui assim que a turma for configurada."
				/>
			) : (
				<ol className="relative space-y-4 before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-px before:bg-slate-200 dark:before:bg-white/10">
					{ordered.map((m) => (
						<MeetingRow key={m.id} meeting={m} />
					))}
				</ol>
			)}
		</div>
	);
}

function MeetingRow({ meeting }: { meeting: MntJourneyMeeting }) {
	const locked = meeting.status === 'locked';
	const done = meeting.status === 'done';
	const title = meeting.template?.title ?? `Encontro ${meeting.position}`;

	const inner = (
		<div
			className={`${CARD} flex-1 p-4 transition ${
				locked ? 'opacity-60' : 'hover:border-teal-500/50'
			}`}
		>
			<div className="flex flex-wrap items-center gap-2">
				<p className="font-semibold text-slate-900 dark:text-slate-100">
					{meeting.position}. {title}
				</p>
				<span
					className={`text-[11px] px-2 py-0.5 rounded-full border ${
						done
							? 'bg-teal-500/10 border-teal-500/40 text-teal-600 dark:text-teal-400'
							: meeting.status === 'in_progress'
								? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400'
								: 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400'
					}`}
				>
					{meetingStatusLabel(meeting.status)}
				</span>
				{meeting.mentor_validated_at && (
					<span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
						<BadgeCheck className="w-3 h-3" />
						Validado pelo mentor
					</span>
				)}
			</div>
			{meeting.template?.subtitle && (
				<p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
					{meeting.template.subtitle}
				</p>
			)}
			{meeting.scheduled_at && (
				<p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
					Agendado para {fmtDate(meeting.scheduled_at)}
				</p>
			)}
			{meeting.mentor_feedback && (
				<div className="mt-3 rounded-xl bg-teal-500/5 border border-teal-500/20 p-3">
					<p className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 mb-1">
						<MessageSquareQuote className="w-3.5 h-3.5" />
						Feedback do mentor
					</p>
					<p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
						{meeting.mentor_feedback}
					</p>
				</div>
			)}
		</div>
	);

	return (
		<li className="relative flex gap-4">
			<div
				className={`z-10 w-10 h-10 shrink-0 rounded-full border-2 flex items-center justify-center bg-white dark:bg-[#111114] ${
					done
						? 'border-teal-500 text-teal-500'
						: locked
							? 'border-slate-200 dark:border-white/10 text-slate-300 dark:text-gray-600'
							: 'border-teal-500/60 text-teal-600 dark:text-teal-400'
				}`}
			>
				{done ? (
					<Check className="w-4 h-4" />
				) : locked ? (
					<Lock className="w-4 h-4" />
				) : (
					<Play className="w-4 h-4" />
				)}
			</div>
			{locked ? (
				inner
			) : (
				<Link
					href={`/course/mentoria/jornada/${meeting.id}`}
					className="flex-1 flex"
				>
					{inner}
				</Link>
			)}
		</li>
	);
}
