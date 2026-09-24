'use client';

// Apresentação da linha do tempo da Jornada — recebe os encontros já ordenados
// por `position` e não busca nada. Quem consulta a API é o `page.tsx`.
//
// A separação existe pelo mesmo motivo dos Indicadores
// (`indicadores/_components/indicadores-view.tsx`): os estados que mais
// importam aqui — encontro bloqueado, encontro com feedback do mentor, encontro
// validado, jornada inteira concluída — são caros de reproduzir de propósito
// numa jornada real, porque o backend é quem libera um encontro por vez. Com a
// vista pura, `app/(dev)/mentoria-jornada-check` monta os casos com fixtures.

import { Badge } from '@upvox-dev/ui';
import {
	BadgeCheck,
	Check,
	Compass,
	Lock,
	MessageSquareQuote,
	Play,
} from 'lucide-react';
import Link from 'next/link';
import type { MntJourneyMeeting } from '@/modules/mentoria/types';
import {
	CARD,
	EmptyState,
	fmtDate,
	MntHeader,
	meetingStatusLabel,
} from '../../_components/shared';

/** Tom do `Badge` por status do encontro. */
const MEETING_STATUS_TONE: Record<
	MntJourneyMeeting['status'],
	'neutral' | 'success' | 'warning' | 'danger' | 'brand'
> = {
	locked: 'neutral',
	available: 'brand',
	in_progress: 'warning',
	done: 'success',
};

export function JornadaView({ meetings }: { meetings: MntJourneyMeeting[] }) {
	return (
		<div className="p-4 md:p-8 max-w-3xl mx-auto">
			<MntHeader
				title="Jornada da Mentoria"
				subtitle="10 encontros para enxergar sua empresa por inteiro"
				icon={Compass}
				backHref="/course/mentoria"
			/>

			{meetings.length === 0 ? (
				<EmptyState
					title="Nenhum encontro na sua jornada ainda"
					description="Os encontros aparecem aqui assim que a turma for configurada."
				/>
			) : (
				// A linha que costura os encontros é um pseudo-elemento do próprio
				// `<ol>`: some sozinha quando a lista está vazia e não entra na
				// árvore de acessibilidade.
				<ol className="relative space-y-4 before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-px before:bg-subtle">
					{meetings.map((m) => (
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
				locked ? 'opacity-60' : 'hover:border-brand-border'
			}`}
		>
			<div className="flex flex-wrap items-center gap-2">
				<p className="text-label text-primary">
					{meeting.position}. {title}
				</p>
				<Badge tone={MEETING_STATUS_TONE[meeting.status]}>
					{meetingStatusLabel(meeting.status)}
				</Badge>
				{meeting.mentor_validated_at && (
					<span className="inline-flex items-center gap-1 rounded-chip bg-success-wash px-2 py-0.5 text-caption text-emerald-600 dark:text-emerald-400">
						<BadgeCheck className="w-3 h-3" aria-hidden />
						Validado pelo mentor
					</span>
				)}
			</div>
			{meeting.template?.subtitle && (
				<p className="mt-1 text-body text-muted">{meeting.template.subtitle}</p>
			)}
			{meeting.scheduled_at && (
				<p className="mt-1 text-caption text-muted">
					Agendado para {fmtDate(meeting.scheduled_at)}
				</p>
			)}
			{meeting.mentor_feedback && (
				<div className="mt-3 rounded-control border border-subtle bg-surface-sunken p-3">
					{/* `text-brand` é valor de modo claro e o DS não publica versão
					    escura — mesma ressalva de `_components/shared.tsx`. */}
					<p className="mb-1 inline-flex items-center gap-1.5 text-caption text-brand dark:text-violet-400">
						<MessageSquareQuote className="w-3.5 h-3.5" aria-hidden />
						Feedback do mentor
					</p>
					<p className="text-body text-secondary whitespace-pre-wrap">
						{meeting.mentor_feedback}
					</p>
				</div>
			)}
		</div>
	);

	return (
		<li className="relative flex gap-4">
			<div
				className={`z-10 w-10 h-10 shrink-0 rounded-full border-2 bg-surface flex items-center justify-center ${
					done
						? 'border-brand text-brand dark:text-violet-400'
						: locked
							? 'border-subtle text-muted'
							: 'border-brand-border text-brand dark:text-violet-400'
				}`}
			>
				{done ? (
					<Check className="w-4 h-4" aria-hidden />
				) : locked ? (
					<Lock className="w-4 h-4" aria-hidden />
				) : (
					<Play className="w-4 h-4" aria-hidden />
				)}
			</div>
			{/* Encontro bloqueado não vira link: o clique não leva a lugar nenhum
			    porque o detalhe também barra o acesso direto por URL. */}
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
