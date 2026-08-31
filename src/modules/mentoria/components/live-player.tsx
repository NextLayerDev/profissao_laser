'use client';

import { Radio } from 'lucide-react';
import type { LivePlayback } from '../types';

/**
 * Player das lives/VODs via player embutido do Mux (player.mux.com) com
 * playback token assinado — nenhuma dependência nova, mesmo esquema de iframe
 * do player de aulas (YouTube/Vimeo).
 */
export function LivePlayer({ playback }: { playback: LivePlayback }) {
	const src = `https://player.mux.com/${playback.playback_id}?playback-token=${playback.token}`;
	return (
		<div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-200 dark:border-white/10">
			<iframe
				src={src}
				title="Transmissão"
				allow="accelerometer; autoplay; encrypted-media; fullscreen; picture-in-picture"
				allowFullScreen
				className="absolute inset-0 w-full h-full"
			/>
			{playback.kind === 'live' && (
				<span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-red-600 text-white text-[11px] font-semibold px-2.5 py-1 animate-pulse">
					<Radio className="w-3 h-3" />
					AO VIVO
				</span>
			)}
		</div>
	);
}
