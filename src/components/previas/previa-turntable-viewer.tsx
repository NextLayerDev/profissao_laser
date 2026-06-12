'use client';

import { Grid2x2, Pause, Play, RotateCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Mockup girando a partir da folha turntable 2×2 gerada pela IA
 * (TL=0°, TR=90°, BL=180°, BR=270°): recorta cada quadrante via CSS e
 * toca como animação, com arraste horizontal para girar manualmente.
 */
interface PreviaTurntableViewerProps {
	src: string;
	alt?: string;
}

// Posição CSS de cada quadrante na folha 2×2, em ordem de giro.
const FRAMES = [
	{ x: 0, y: 0 }, // 0°   (top-left)
	{ x: 100, y: 0 }, // 90°  (top-right)
	{ x: 0, y: 100 }, // 180° (bottom-left)
	{ x: 100, y: 100 }, // 270° (bottom-right)
] as const;

const FRAME_MS = 600;
const DRAG_PX_PER_FRAME = 50;

export function PreviaTurntableViewer({
	src,
	alt,
}: PreviaTurntableViewerProps) {
	const [frame, setFrame] = useState(0);
	const [playing, setPlaying] = useState(true);
	const [showSheet, setShowSheet] = useState(false);
	const dragStart = useRef<{ x: number; frame: number } | null>(null);

	useEffect(() => {
		if (!playing || showSheet) return;
		const id = window.setInterval(
			() => setFrame((f) => (f + 1) % FRAMES.length),
			FRAME_MS,
		);
		return () => window.clearInterval(id);
	}, [playing, showSheet]);

	function onPointerDown(e: React.PointerEvent) {
		dragStart.current = { x: e.clientX, frame };
		setPlaying(false);
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: React.PointerEvent) {
		if (!dragStart.current) return;
		const delta = Math.round(
			(e.clientX - dragStart.current.x) / DRAG_PX_PER_FRAME,
		);
		const next =
			(((dragStart.current.frame + delta) % FRAMES.length) + FRAMES.length) %
			FRAMES.length;
		setFrame(next);
	}

	function onPointerUp() {
		dragStart.current = null;
	}

	const pos = FRAMES[frame] ?? FRAMES[0];

	return (
		<div className="space-y-2">
			{showSheet ? (
				<img
					src={src}
					alt={alt ?? 'Folha turntable com 4 ângulos'}
					className="w-full rounded-xl"
				/>
			) : (
				<div
					className="relative w-full aspect-square overflow-hidden rounded-xl cursor-grab active:cursor-grabbing select-none touch-none"
					onPointerDown={onPointerDown}
					onPointerMove={onPointerMove}
					onPointerUp={onPointerUp}
					onPointerCancel={onPointerUp}
					role="img"
					aria-label={alt ?? 'Mockup girando — arraste para girar'}
					style={{
						backgroundImage: `url(${src})`,
						backgroundSize: '200% 200%',
						backgroundPosition: `${pos.x}% ${pos.y}%`,
					}}
				>
					<span className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/50 text-white text-[11px] font-medium pointer-events-none">
						<RotateCw className="w-3 h-3" />
						{frame * 90}° — arraste para girar
					</span>
				</div>
			)}

			<div className="flex items-center justify-center gap-2">
				<button
					type="button"
					onClick={() => setPlaying((p) => !p)}
					disabled={showSheet}
					className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors disabled:opacity-40"
				>
					{playing ? (
						<Pause className="w-3.5 h-3.5" />
					) : (
						<Play className="w-3.5 h-3.5" />
					)}
					{playing ? 'Pausar giro' : 'Girar'}
				</button>
				<button
					type="button"
					onClick={() => setShowSheet((s) => !s)}
					className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
				>
					<Grid2x2 className="w-3.5 h-3.5" />
					{showSheet ? 'Ver girando' : 'Ver folha completa'}
				</button>
			</div>
		</div>
	);
}
