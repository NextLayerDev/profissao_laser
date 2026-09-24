'use client';

// Apresentação das lives da turma — recebe a lista já carregada e só decide
// como agrupar e desenhar. Quem busca é o `page.tsx`.
//
// O agrupamento mora aqui, e não no container, porque é escolha visual: a API
// devolve uma lista plana e nada no contrato diz que ela vem separada por
// status (diferente da Jornada, onde a ordem por `position` é contrato e por
// isso é ordenada no container).
//
// Ver as quatro seções ao mesmo tempo é caro de propósito — depende do mentor
// estar transmitindo, e `ended` dura poucos minutos. `app/(dev)/mentoria-lives-check`
// monta os cenários com fixtures.

import { Badge, type Tone } from '@upvox-dev/ui';
import type { LucideIcon } from 'lucide-react';
import {
	CalendarClock,
	Hourglass,
	PlaySquare,
	Radio,
	Video,
} from 'lucide-react';
import Link from 'next/link';
import type { LiveStatus, MntLiveRoom } from '@/modules/mentoria/types';
import {
	CARD,
	EmptyState,
	fmtDateTime,
	MntHeader,
} from '../../_components/shared';

type StatusMeta = {
	section: string;
	note: string;
	icon: LucideIcon;
	badge?: { label: string; tone: Tone };
};

// Mapa fechado por `LiveStatus` de propósito: a versão anterior filtrava três
// status soltos e uma live `ended` — encerrada com a gravação ainda
// processando — simplesmente sumia da tela. Com o Record + ORDER, um status
// novo no backend quebra o type check em vez de desaparecer em silêncio.
const STATUS_META: Record<LiveStatus, StatusMeta> = {
	active: {
		section: 'Ao vivo agora',
		note: 'A transmissão já começou.',
		icon: Radio,
		badge: { label: 'AO VIVO', tone: 'danger' },
	},
	idle: {
		section: 'Agendadas',
		note: 'O player abre sozinho quando o mentor iniciar.',
		icon: CalendarClock,
	},
	ended: {
		section: 'Encerradas',
		note: 'A gravação está sendo processada e aparece em Gravações em alguns minutos.',
		icon: Hourglass,
		badge: { label: 'PROCESSANDO', tone: 'warning' },
	},
	vod_ready: {
		section: 'Gravações',
		note: 'Disponíveis para assistir quando quiser.',
		icon: PlaySquare,
		badge: { label: 'GRAVAÇÃO', tone: 'neutral' },
	},
};

const ORDER: LiveStatus[] = ['active', 'idle', 'ended', 'vod_ready'];

/** Agendada mostra quando vai ser; as demais, quando começou. */
function liveDate(live: MntLiveRoom): string {
	if (live.status === 'idle') return fmtDateTime(live.scheduled_at);
	return fmtDateTime(live.started_at ?? live.scheduled_at);
}

export function LivesView({ lives }: { lives: MntLiveRoom[] }) {
	const groups = ORDER.map((status) => ({
		status,
		lives: lives.filter((l) => l.status === status),
	})).filter((g) => g.lives.length > 0);

	return (
		<div className="p-4 md:p-8 max-w-5xl mx-auto">
			<MntHeader
				title="Lives da mentoria"
				subtitle="Transmissões fechadas para a sua turma — ao vivo e gravações"
				icon={Video}
				backHref="/course/mentoria"
			/>

			{lives.length === 0 ? (
				<EmptyState
					icon={Video}
					title="Nenhuma live por enquanto"
					description="Quando o mentor agendar uma transmissão, ela aparece aqui."
				/>
			) : (
				<div className="space-y-8">
					{groups.map(({ status, lives: group }) => (
						<Section key={status} meta={STATUS_META[status]}>
							{group.map((live) => (
								<LiveCard key={live.id} live={live} />
							))}
						</Section>
					))}
				</div>
			)}
		</div>
	);
}

function Section({
	meta,
	children,
}: {
	meta: StatusMeta;
	children: React.ReactNode;
}) {
	const Icon = meta.icon;
	return (
		<section>
			<div className="mb-3">
				<h2 className="flex items-center gap-2 text-caption uppercase tracking-wide text-muted">
					<Icon className="w-4 h-4" aria-hidden />
					{meta.section}
				</h2>
				<p className="text-caption text-muted mt-0.5">{meta.note}</p>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
		</section>
	);
}

// Não é `ListRow`: a linha de lista trunca a descrição em uma linha e não tem
// lugar para a data. Aqui o card precisa de título + duas linhas de descrição +
// data, então é DOM sobre `CARD`, com o `Badge` do DS no lugar das três pílulas
// `rounded-full` que a tela tinha antes.
//
// Também não é o `Card` do DS: ele fixa `p-2xl`, e a versão clicável usa
// `onPress` — que não é link, então perderia o clique do meio e o "abrir em
// nova aba". Mesma decisão já registrada em `encontro-view.tsx`.
function LiveCard({ live }: { live: MntLiveRoom }) {
	const meta = STATUS_META[live.status];
	const isLive = live.status === 'active';

	return (
		<Link
			href={`/course/mentoria/lives/${live.id}`}
			className={`${CARD} block p-4 transition-colors hover:border-brand-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
				isLive ? 'ring-1 ring-danger' : ''
			}`}
		>
			<div className="flex items-center gap-2 mb-1.5">
				{meta.badge && (
					<Badge
						tone={meta.badge.tone}
						className={isLive ? 'animate-pulse' : undefined}
					>
						{meta.badge.label}
					</Badge>
				)}
				<p className="text-label text-primary truncate">{live.title}</p>
			</div>
			{live.description && (
				<p className="text-body text-secondary line-clamp-2 mb-1.5">
					{live.description}
				</p>
			)}
			<p className="text-caption text-muted tabular-nums">{liveDate(live)}</p>
		</Link>
	);
}
