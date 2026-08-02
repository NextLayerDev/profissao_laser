'use client';

import { Layers, Maximize2, Minus, Plus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Viewer de SVG com zoom, pan, régua em mm e camadas.
 *
 * Zero dependência: o transform é um `<g>` com translate/scale, não uma lib de
 * canvas. E o DXF NUNCA é lido aqui — o motor devolve `{ svg: prévia, dxf:
 * download }`, então o cliente só toca no SVG. Parsear DXF no browser seria
 * reimplementar no front o que o servidor já faz, com metade da informação.
 */

export interface VectorLayer {
	id: string;
	label: string;
	color: string;
	visible: boolean;
}

interface Props {
	/** Markup SVG inline ou data URL. */
	svg: string;
	layers?: VectorLayer[];
	/** Unidades do viewBox por milímetro — desenha a barra de escala e as cotas. */
	unitsPerMm?: number;
	/** Dimensões reais da peça, para a barra técnica. */
	widthMm?: number;
	heightMm?: number;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 40;

export function VectorViewport({
	svg,
	layers,
	unitsPerMm,
	widthMm,
	heightMm,
}: Props) {
	const hostRef = useRef<HTMLDivElement>(null);
	const [scale, setScale] = useState(1);
	const [pan, setPan] = useState({ x: 0, y: 0 });
	const [dragging, setDragging] = useState(false);
	const [showLayers, setShowLayers] = useState(false);
	const [hidden, setHidden] = useState<Set<string>>(new Set());
	const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

	const fit = useCallback(() => {
		setScale(1);
		setPan({ x: 0, y: 0 });
	}, []);

	const zoomBy = useCallback((factor: number) => {
		setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * factor)));
	}, []);

	// Zoom com foco no cursor: sem isso, dar zoom "puxa" o desenho para longe do
	// ponto que a pessoa está olhando, que é o comportamento que faz um viewer
	// de CAD parecer quebrado.
	useEffect(() => {
		const el = hostRef.current;
		if (!el) return;
		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			const rect = el.getBoundingClientRect();
			const cx = e.clientX - rect.left - rect.width / 2;
			const cy = e.clientY - rect.top - rect.height / 2;
			const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
			setScale((prev) => {
				const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev * factor));
				const ratio = next / prev;
				setPan((p) => ({
					x: cx - (cx - p.x) * ratio,
					y: cy - (cy - p.y) * ratio,
				}));
				return next;
			});
		};
		el.addEventListener('wheel', onWheel, { passive: false });
		return () => el.removeEventListener('wheel', onWheel);
	}, []);

	const onKeyDown = (e: React.KeyboardEvent) => {
		const step = 24;
		if (e.key === 'ArrowLeft') setPan((p) => ({ ...p, x: p.x + step }));
		else if (e.key === 'ArrowRight') setPan((p) => ({ ...p, x: p.x - step }));
		else if (e.key === 'ArrowUp') setPan((p) => ({ ...p, y: p.y + step }));
		else if (e.key === 'ArrowDown') setPan((p) => ({ ...p, y: p.y - step }));
		else if (e.key === '+' || e.key === '=') zoomBy(1.2);
		else if (e.key === '-') zoomBy(1 / 1.2);
		else if (e.key === '0') fit();
		else if (e.key.toLowerCase() === 'l') setShowLayers((v) => !v);
		else return;
		e.preventDefault();
	};

	const toggleLayer = (id: string) => {
		setHidden((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const isDataUrl = svg.trimStart().startsWith('data:');
	// Barra de escala: quantos mm cabem em 100px na escala atual.
	const mmPer100px = unitsPerMm ? 100 / (unitsPerMm * scale) : null;

	return (
		<div className="space-y-0">
			<div
				ref={hostRef}
				// `application` + tabIndex: o viewport É um widget de navegação por
				// teclado (setas/zoom), não conteúdo estático — o foco é intencional.
				role="application"
				aria-label="Visualizador de vetor. Setas movem, + e - dão zoom, 0 enquadra, L alterna camadas."
				// biome-ignore lint/a11y/noNoninteractiveTabindex: widget de navegação por teclado
				tabIndex={0}
				onKeyDown={onKeyDown}
				onPointerDown={(e) => {
					setDragging(true);
					dragStart.current = {
						x: e.clientX,
						y: e.clientY,
						panX: pan.x,
						panY: pan.y,
					};
					(e.target as Element).setPointerCapture?.(e.pointerId);
				}}
				onPointerMove={(e) => {
					if (!dragging) return;
					setPan({
						x: dragStart.current.panX + (e.clientX - dragStart.current.x),
						y: dragStart.current.panY + (e.clientY - dragStart.current.y),
					});
				}}
				onPointerUp={() => setDragging(false)}
				onPointerLeave={() => setDragging(false)}
				className={`relative h-[clamp(360px,62vh,720px)] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--screen-accent,#7c3aed)_45%,transparent)] dark:border-white/10 dark:bg-[#111] dark:shadow-black/40 ${
					dragging ? 'cursor-grabbing' : 'cursor-grab'
				}`}
			>
				<div
					className="absolute inset-0 flex items-center justify-center"
					style={{
						transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
						transformOrigin: 'center',
					}}
				>
					{isDataUrl ? (
						<img src={svg} alt="Vetor" className="max-h-full max-w-full" />
					) : (
						<div
							className="[&_svg]:max-h-full [&_svg]:max-w-full"
							// biome-ignore lint/security/noDangerouslySetInnerHtml: SVG gerado pelo nosso motor, não por usuário
							dangerouslySetInnerHTML={{ __html: svg }}
							ref={(el) => {
								if (!el) return;
								for (const g of Array.from(
									el.querySelectorAll('[data-layer]'),
								)) {
									const id = g.getAttribute('data-layer') ?? '';
									(g as SVGElement).style.display = hidden.has(id)
										? 'none'
										: '';
								}
							}}
						/>
					)}
				</div>

				{/* Controles */}
				<div className="absolute left-3 top-3 flex gap-1">
					<button
						type="button"
						aria-label="Aproximar"
						onClick={() => zoomBy(1.25)}
						className="rounded-lg border border-slate-200 bg-white/90 p-1.5 backdrop-blur dark:border-white/10 dark:bg-black/50"
					>
						<Plus className="h-3.5 w-3.5" />
					</button>
					<button
						type="button"
						aria-label="Afastar"
						onClick={() => zoomBy(1 / 1.25)}
						className="rounded-lg border border-slate-200 bg-white/90 p-1.5 backdrop-blur dark:border-white/10 dark:bg-black/50"
					>
						<Minus className="h-3.5 w-3.5" />
					</button>
					<button
						type="button"
						aria-label="Enquadrar"
						onClick={fit}
						className="rounded-lg border border-slate-200 bg-white/90 p-1.5 backdrop-blur dark:border-white/10 dark:bg-black/50"
					>
						<Maximize2 className="h-3.5 w-3.5" />
					</button>
					{layers?.length ? (
						<button
							type="button"
							aria-label="Camadas"
							aria-pressed={showLayers}
							onClick={() => setShowLayers((v) => !v)}
							className="rounded-lg border border-slate-200 bg-white/90 p-1.5 backdrop-blur dark:border-white/10 dark:bg-black/50"
						>
							<Layers className="h-3.5 w-3.5" />
						</button>
					) : null}
				</div>

				{showLayers && layers?.length ? (
					<div className="absolute right-3 top-3 rounded-xl border border-slate-200 bg-white/95 p-2 backdrop-blur dark:border-white/10 dark:bg-black/70">
						{layers.map((l) => (
							<label
								key={l.id}
								className="flex cursor-pointer items-center gap-2 px-1 py-1 text-xs"
							>
								<input
									type="checkbox"
									checked={!hidden.has(l.id)}
									onChange={() => toggleLayer(l.id)}
								/>
								<span
									className="h-2.5 w-2.5 rounded-sm"
									style={{ background: l.color }}
								/>
								{l.label}
							</label>
						))}
					</div>
				) : null}

				{/* Barra de escala — é o que separa um viewer de CAD de um <img>. */}
				{mmPer100px ? (
					<div className="absolute bottom-3 left-3 flex items-center gap-2">
						<div className="h-2 w-[100px] border-x border-b border-slate-400 dark:border-slate-500" />
						<span className="font-mono text-[11px] tabular-nums text-slate-500">
							{mmPer100px < 10 ? mmPer100px.toFixed(1) : Math.round(mmPer100px)}{' '}
							mm
						</span>
					</div>
				) : null}
			</div>

			{/* Barra técnica: a assinatura visual de "ferramenta profissional". */}
			{widthMm || heightMm ? (
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-200 px-1 py-2 font-mono text-[11px] tabular-nums text-slate-500 dark:border-white/10">
					{widthMm && heightMm ? (
						<span>
							{Math.round(widthMm)} × {Math.round(heightMm)} mm
						</span>
					) : null}
					{layers?.length ? <span>· {layers.length} camadas</span> : null}
					<span className="ml-auto">{Math.round(scale * 100)}%</span>
				</div>
			) : null}
		</div>
	);
}
