'use client';

import { Badge } from '@upvox-dev/ui';
import { Radio } from 'lucide-react';
import { useState } from 'react';
import type { LivePlayback } from '../types';

/**
 * Player das lives/VODs via player embutido do Mux (player.mux.com) com
 * playback token assinado — nenhuma dependência nova, mesmo esquema de iframe
 * do player de aulas (YouTube/Vimeo).
 *
 * O badge sai do `kind` do playback, não do status da sala: é o token que diz
 * se o que está tocando é a transmissão ou a gravação.
 */
export function LivePlayer({ playback }: { playback: LivePlayback }) {
	// O `src` fica preso ao primeiro token de cada playback_id: o hook renova o
	// token a cada 45 min e trocar o `src` recarregava o iframe — a gravação
	// voltava para 0:00 e a live reconectava no meio do encontro. O Mux só
	// confere o token no início da sessão; um remount já pega o token novo.
	const [frame, setFrame] = useState(() => ({
		id: playback.playback_id,
		src: buildSrc(playback),
	}));
	if (frame.id !== playback.playback_id) {
		setFrame({ id: playback.playback_id, src: buildSrc(playback) });
	}
	const src = frame.src;
	return (
		// `bg-black` fica: é moldura de vídeo, não superfície de tema.
		<div className="relative w-full aspect-video rounded-card overflow-hidden bg-black border border-subtle">
			<iframe
				src={src}
				title="Transmissão"
				allow="accelerometer; autoplay; encrypted-media; fullscreen; picture-in-picture"
				allowFullScreen
				className="absolute inset-0 w-full h-full"
			/>
			{playback.kind === 'live' && (
				<Badge tone="danger" className="absolute top-3 left-3 animate-pulse">
					{/* Children em elemento (e não string) pula o `<Text>` automático do
					    Badge, e com ele o `badgeLabel` — daí as classes do rótulo virem
					    explícitas aqui, iguais às do tom `danger`. */}
					<span className="inline-flex items-center gap-1.5 text-caption text-danger-strong">
						<Radio className="w-3 h-3" aria-hidden />
						AO VIVO
					</span>
				</Badge>
			)}
		</div>
	);
}

function buildSrc(playback: LivePlayback): string {
	return `https://player.mux.com/${playback.playback_id}?playback-token=${playback.token}`;
}
