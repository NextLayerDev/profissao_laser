'use client';

// Apresentação do detalhe de uma live: player (ou o aviso que ocupa o lugar
// dele) e o chat ao lado. Quem busca a sala e o token de playback é o
// `page.tsx`.
//
// `app/(dev)/mentoria-lives-check` renderiza os três estados com fixtures —
// transmitindo, aguardando e encerrada são estados de minutos numa live real.

import { Hourglass, Video } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { LiveChat } from '@/modules/mentoria/components/live-chat';
import { LivePlayer } from '@/modules/mentoria/components/live-player';
import type { LivePlayback, MntLiveRoom } from '@/modules/mentoria/types';
import {
	BTN_GHOST,
	CARD,
	EmptyState,
	MntHeader,
} from '../../../_components/shared';

/**
 * O que ocupa a área do player. Derivado no container: só ele sabe se o token
 * de playback chegou, e a view não deve refazer a regra.
 */
export type PlaybackState = 'playing' | 'ended' | 'waiting';

const WAITING_COPY: Record<
	Exclude<PlaybackState, 'playing'>,
	{ title: string; description: string }
> = {
	ended: {
		title: 'Live encerrada',
		description:
			'A gravação está sendo processada e aparece aqui em alguns minutos.',
	},
	waiting: {
		title: 'Aguardando transmissão',
		description:
			'Quando o mentor iniciar a live, o player abre automaticamente.',
	},
};

export function LiveView({
	live,
	playback,
	playbackState,
	chat,
}: {
	live: MntLiveRoom;
	playback: LivePlayback | null;
	playbackState: PlaybackState;
	/**
	 * Slot do chat. Na rota real fica o `LiveChat`, que busca sozinho; a rota de
	 * conferência injeta o `LiveChatView` com fixtures, sem rede.
	 */
	chat?: ReactNode;
}) {
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
					{playbackState === 'playing' && playback ? (
						<LivePlayer playback={playback} />
					) : (
						<Waiting
							{...WAITING_COPY[playbackState === 'ended' ? 'ended' : 'waiting']}
						/>
					)}
				</div>
				{/* `aspect-video` no mobile, onde o chat vira uma faixa abaixo do
				    player: mesma proporção do vídeo, então os dois encolhem juntos
				    conforme a largura da tela, em vez do chat ficar com uma altura
				    fixa desproporcional ao player acima dele. No `lg` os dois viram
				    colunas lado a lado e o grid já estica o chat pra acompanhar a
				    altura da coluna do player. */}
				<div className="aspect-video lg:aspect-auto lg:h-auto">
					{chat ?? <LiveChat liveId={live.id} />}
				</div>
			</div>
		</div>
	);
}

/**
 * Sala inexistente ou de outra turma. Mora aqui, e não solto no container, para
 * a rota de conferência conseguir renderizar o mesmo estado.
 */
export function LiveNotFound() {
	return (
		<div className="p-4 md:p-8 max-w-5xl mx-auto">
			<MntHeader
				title="Live não encontrada"
				icon={Video}
				backHref="/course/mentoria/lives"
			/>
			<EmptyState
				icon={Video}
				title="Essa transmissão não está disponível"
				description="Ela pode ter sido removida ou não pertencer à sua turma."
			>
				<Link href="/course/mentoria/lives" className={BTN_GHOST}>
					Ver todas as lives
				</Link>
			</EmptyState>
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
			{/* `text-brand` é valor de modo claro e o DS não publica versão escura
			    dele — o mesmo token é FUNDO do botão primário. Até o DS ter tons
			    semânticos de texto para o escuro, o par `dark:` fica. */}
			<Hourglass
				className="w-8 h-8 text-brand dark:text-violet-400 mb-3 animate-pulse"
				aria-hidden
			/>
			<p className="text-title text-primary">{title}</p>
			<p className="text-body text-muted mt-1 max-w-sm">{description}</p>
		</div>
	);
}
