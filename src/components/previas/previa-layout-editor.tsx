'use client';

import { RotateCcw, RotateCw, Undo2 } from 'lucide-react';
import { type PointerEvent, useEffect, useId, useRef } from 'react';
import type { PreviaLayout, PreviaLayoutBox } from '@/types/previas';
import {
	boxWithProductFraction,
	clampBox,
	LAYOUT_KEYS,
	LAYOUT_LABEL,
	type LayoutKey,
	normalizeRotation,
	productFraction,
	SIZE_STEPS,
	scaleBox,
	textAspect,
} from '@/utils/previa-layout';

export interface LayoutContent {
	logo: string | null;
	texto: string;
	texto2: string;
}

type DragMode = 'move' | 'resize' | 'rotate';

function rotationLabel(rot: number) {
	if (rot === 0) return 'sem rotação';
	return `girado ${Math.abs(rot)}° ${rot > 0 ? 'para a direita' : 'para a esquerda'}`;
}

export function describeBox(
	key: LayoutKey,
	b: PreviaLayoutBox,
	productWidth: number | null,
) {
	const pct = Math.round(productFraction(b.w, productWidth) * 100);
	return `${LAYOUT_LABEL[key]}: ${pct}% do produto · ${rotationLabel(b.rot)}`;
}

/**
 * Camada do editor sobre a foto do produto: cada elemento (imagem, texto,
 * 2º texto) é uma caixa que dá para arrastar, redimensionar (canto) e girar
 * (alça de cima). No teclado: setas movem, + e − mudam o tamanho, [ e ] giram.
 * A arte em si é desenhada numa camada por baixo, com mistura no produto.
 */
export function LayoutCanvas({
	boxes,
	content,
	dark,
	fontFamily,
	editable,
	selected,
	onSelect,
	onChange,
	productWidth,
}: {
	boxes: PreviaLayout;
	content: LayoutContent;
	dark: boolean;
	fontFamily?: string;
	editable: boolean;
	selected: LayoutKey | null;
	onSelect: (key: LayoutKey | null) => void;
	onChange: (key: LayoutKey, box: PreviaLayoutBox) => void;
	productWidth: number | null;
}) {
	const layerRef = useRef<HTMLDivElement>(null);
	const helpId = useId();
	const drag = useRef<{
		key: LayoutKey;
		mode: DragMode;
		x: number;
		y: number;
		box: PreviaLayoutBox;
		rect: DOMRect;
	} | null>(null);

	// Teclas em sequência chegam antes do próximo render: cada uma parte da
	// última caixa calculada, não da que estava na tela.
	const latest = useRef(boxes);
	useEffect(() => {
		latest.current = boxes;
	}, [boxes]);

	const keys = LAYOUT_KEYS.filter((k) => boxes[k]);

	function startDrag(e: PointerEvent, key: LayoutKey, mode: DragMode) {
		const box = boxes[key];
		const layer = layerRef.current;
		if (!editable || !box || !layer || e.button !== 0) return;
		e.preventDefault();
		e.stopPropagation();
		drag.current = {
			key,
			mode,
			x: e.clientX,
			y: e.clientY,
			box,
			rect: layer.getBoundingClientRect(),
		};
		onSelect(key);
		// O preventDefault acima impede o foco: devolve para a caixa, assim o
		// teclado continua dali.
		(e.currentTarget as HTMLElement)
			.closest<HTMLElement>('[aria-roledescription]')
			?.focus({ preventScroll: true });
		try {
			e.currentTarget.setPointerCapture(e.pointerId);
		} catch {
			// ponteiro já solto — o arrasto termina no próximo pointerup
		}
	}

	function moveDrag(e: PointerEvent) {
		const d = drag.current;
		if (!d) return;
		const { rect, box } = d;
		const cx = rect.left + box.x * rect.width;
		const cy = rect.top + box.y * rect.height;
		if (d.mode === 'move') {
			onChange(
				d.key,
				clampBox({
					...box,
					x: box.x + (e.clientX - d.x) / rect.width,
					y: box.y + (e.clientY - d.y) / rect.height,
				}),
			);
		} else if (d.mode === 'resize') {
			const from = Math.hypot(d.x - cx, d.y - cy) || 1;
			const to = Math.hypot(e.clientX - cx, e.clientY - cy);
			onChange(d.key, scaleBox(box, to / from));
		} else {
			let deg =
				(Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI + 90;
			if (e.shiftKey) deg = Math.round(deg / 15) * 15;
			else {
				// Ímã nos ângulos retos: fica fácil voltar ao "em pé".
				const right = Math.round(deg / 90) * 90;
				if (Math.abs(deg - right) < 5) deg = right;
			}
			onChange(d.key, { ...box, rot: normalizeRotation(deg) });
		}
	}

	function endDrag() {
		drag.current = null;
	}

	function onKey(e: React.KeyboardEvent, key: LayoutKey) {
		const box = latest.current[key];
		if (!editable || !box) return;
		const step = e.shiftKey ? 0.05 : 0.01;
		let next: PreviaLayoutBox | null = null;
		switch (e.key) {
			case 'ArrowLeft':
				next = clampBox({ ...box, x: box.x - step });
				break;
			case 'ArrowRight':
				next = clampBox({ ...box, x: box.x + step });
				break;
			case 'ArrowUp':
				next = clampBox({ ...box, y: box.y - step });
				break;
			case 'ArrowDown':
				next = clampBox({ ...box, y: box.y + step });
				break;
			case '+':
			case '=':
				next = scaleBox(box, 1.08);
				break;
			case '-':
			case '_':
				next = scaleBox(box, 1 / 1.08);
				break;
			case '[':
			case '{':
				next = {
					...box,
					rot: normalizeRotation(box.rot - (e.shiftKey ? 15 : 5)),
				};
				break;
			case ']':
			case '}':
				next = {
					...box,
					rot: normalizeRotation(box.rot + (e.shiftKey ? 15 : 5)),
				};
				break;
			case 'Escape':
				onSelect(null);
				(e.currentTarget as HTMLElement).blur();
				return;
			default:
				return;
		}
		e.preventDefault();
		latest.current = { ...latest.current, [key]: next };
		onChange(key, next);
	}

	const geometry = (b: PreviaLayoutBox) => ({
		left: `${b.x * 100}%`,
		top: `${b.y * 100}%`,
		width: `${b.w * 100}%`,
		height: `${b.h * 100}%`,
		transform: `translate(-50%, -50%) rotate(${b.rot}deg)`,
	});

	return (
		<div
			ref={layerRef}
			className="absolute inset-0"
			onPointerDown={() => editable && onSelect(null)}
		>
			{/* A arte, misturada no produto (o `transform` isola o contexto, então
			    a mistura fica em cada caixa, não no conteúdo dela). */}
			{keys.map((key) => {
				const b = boxes[key] as PreviaLayoutBox;
				const text = key === 'texto' ? content.texto : content.texto2;
				return (
					<div
						key={`art-${key}`}
						aria-hidden="true"
						className="pointer-events-none absolute flex items-center justify-center"
						style={{
							...geometry(b),
							mixBlendMode: dark ? 'screen' : 'multiply',
							opacity: 0.88,
						}}
					>
						{key === 'logo' && content.logo ? (
							<img
								src={content.logo}
								alt=""
								className="h-full w-full object-contain"
								style={{
									filter: dark
										? 'grayscale(1) invert(1) contrast(1.4)'
										: 'grayscale(1) contrast(1.3)',
								}}
							/>
						) : (
							<span
								className="flex h-full w-full items-center justify-center"
								style={{ containerType: 'size' }}
							>
								<span
									className={`whitespace-nowrap font-semibold leading-none ${
										dark ? 'text-slate-100' : 'text-slate-900'
									}`}
									style={{
										fontFamily,
										// Cabe na caixa: limitado pela altura e pela largura.
										fontSize: `min(78cqh, ${(96 / textAspect(text)).toFixed(2)}cqw)`,
									}}
								>
									{text}
								</span>
							</span>
						)}
					</div>
				);
			})}

			{/* Alças e foco, por cima e sem mistura. */}
			{editable && (
				<p id={helpId} className="sr-only">
					Arraste para mover. No teclado: setas movem (Shift para ir mais
					rápido), + e − mudam o tamanho, [ e ] giram. Esc solta.
				</p>
			)}
			{keys.map((key) => {
				const b = boxes[key] as PreviaLayoutBox;
				const active = selected === key;
				if (!editable) return null;
				return (
					// biome-ignore lint/a11y/useSemanticElements: caixa arrastável; não há elemento nativo equivalente
					<div
						key={`ctl-${key}`}
						role="button"
						tabIndex={0}
						aria-roledescription="elemento arrastável"
						aria-label={describeBox(key, b, productWidth)}
						aria-describedby={helpId}
						aria-pressed={active}
						onFocus={() => onSelect(key)}
						onKeyDown={(e) => onKey(e, key)}
						onPointerDown={(e) => startDrag(e, key, 'move')}
						onPointerMove={moveDrag}
						onPointerUp={endDrag}
						onPointerCancel={endDrag}
						className={`absolute cursor-move touch-none rounded-[3px] outline-none before:absolute before:-inset-2.5 before:content-[''] ${
							active
								? 'border-2 border-violet-500 shadow-[0_0_0_1px_rgba(255,255,255,0.7)]'
								: 'border border-dashed border-slate-500/60 hover:border-violet-400 focus-visible:border-2 focus-visible:border-violet-500'
						}`}
						style={geometry(b)}
					>
						{active && (
							<>
								<span
									aria-hidden="true"
									className="absolute left-1/2 -top-6 h-5 w-px -translate-x-1/2 bg-violet-500"
								/>
								<span
									aria-hidden="true"
									title="Girar"
									onPointerDown={(e) => startDrag(e, key, 'rotate')}
									onPointerMove={moveDrag}
									onPointerUp={endDrag}
									onPointerCancel={endDrag}
									className="absolute left-1/2 -top-9 flex h-7 w-7 -translate-x-1/2 cursor-grab items-center justify-center"
								>
									<span className="h-3.5 w-3.5 rounded-full border-2 border-violet-500 bg-white shadow" />
								</span>
								<span
									aria-hidden="true"
									title="Redimensionar"
									onPointerDown={(e) => startDrag(e, key, 'resize')}
									onPointerMove={moveDrag}
									onPointerUp={endDrag}
									onPointerCancel={endDrag}
									className="absolute -bottom-3.5 -right-3.5 flex h-7 w-7 cursor-nwse-resize items-center justify-center"
								>
									<span className="h-3.5 w-3.5 rounded-sm border-2 border-violet-500 bg-white shadow" />
								</span>
							</>
						)}
					</div>
				);
			})}
		</div>
	);
}

const chip =
	'inline-flex h-8 items-center justify-center gap-1 rounded-lg border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500';
const chipIdle =
	'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5';
const chipOn =
	'border-violet-500 bg-violet-50 text-violet-800 dark:bg-violet-500/15 dark:text-violet-100';

/**
 * Controles do elemento escolhido — o mesmo que dá para fazer arrastando, em
 * botões: qual elemento, tamanho P/M/G, girar e centralizar. Mostra também se
 * a posição é a automática ou a do aluno (e volta ao automático).
 */
export function LayoutToolbar({
	boxes,
	selected,
	onSelect,
	onChange,
	productWidth,
	manual,
	onReset,
}: {
	boxes: PreviaLayout;
	selected: LayoutKey | null;
	onSelect: (key: LayoutKey) => void;
	onChange: (key: LayoutKey, box: PreviaLayoutBox) => void;
	productWidth: number | null;
	manual: boolean;
	onReset: () => void;
}) {
	const keys = LAYOUT_KEYS.filter((k) => boxes[k]);
	const current = selected && boxes[selected] ? selected : null;
	const box = current ? (boxes[current] as PreviaLayoutBox) : null;
	const frac = box ? productFraction(box.w, productWidth) : 0;
	const nearest = box
		? SIZE_STEPS.reduce((best, s) =>
				Math.abs(s.frac - frac) < Math.abs(best.frac - frac) ? s : best,
			)
		: null;

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between gap-2">
				<p
					className="min-w-0 text-xs text-slate-600 dark:text-gray-400"
					aria-live="polite"
				>
					{box && current ? (
						<span className="font-medium text-slate-800 dark:text-slate-100">
							{describeBox(current, box, productWidth)}
						</span>
					) : manual ? (
						'Posição sua — a IA segue essa marcação.'
					) : (
						'Posição automática · arraste a arte para ajustar.'
					)}
				</p>
				{manual && (
					<button
						type="button"
						onClick={onReset}
						className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-violet-700 underline-offset-2 hover:underline dark:text-violet-300"
					>
						<Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
						Automático
					</button>
				)}
			</div>

			<div className="flex flex-wrap items-center gap-1.5">
				{keys.length > 1 &&
					keys.map((k) => (
						<button
							key={k}
							type="button"
							aria-pressed={current === k}
							onClick={() => onSelect(k)}
							className={`${chip} ${current === k ? chipOn : chipIdle}`}
						>
							{LAYOUT_LABEL[k]}
						</button>
					))}
				{box && current && (
					<>
						{keys.length > 1 && (
							<span
								aria-hidden="true"
								className="mx-0.5 h-5 w-px bg-slate-200 dark:bg-white/10"
							/>
						)}
						{/* biome-ignore lint/a11y/useSemanticElements: grupo de botões de tamanho */}
						<div role="group" aria-label="Tamanho" className="flex gap-1">
							{SIZE_STEPS.map((s) => (
								<button
									key={s.key}
									type="button"
									title={s.label}
									aria-label={`Tamanho ${s.label}`}
									aria-pressed={nearest?.key === s.key}
									onClick={() =>
										onChange(
											current,
											boxWithProductFraction(box, s.frac, productWidth),
										)
									}
									className={`${chip} w-8 px-0 ${nearest?.key === s.key ? chipOn : chipIdle}`}
								>
									{s.key}
								</button>
							))}
						</div>
						<button
							type="button"
							aria-label="Girar 15° para a esquerda"
							onClick={() =>
								onChange(current, {
									...box,
									rot: normalizeRotation(box.rot - 15),
								})
							}
							className={`${chip} w-8 px-0 ${chipIdle}`}
						>
							<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
						</button>
						<button
							type="button"
							aria-label="Girar 15° para a direita"
							onClick={() =>
								onChange(current, {
									...box,
									rot: normalizeRotation(box.rot + 15),
								})
							}
							className={`${chip} w-8 px-0 ${chipIdle}`}
						>
							<RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
						</button>
						<button
							type="button"
							onClick={() =>
								onChange(current, clampBox({ ...box, x: 0.5, rot: 0 }))
							}
							className={`${chip} ${chipIdle}`}
						>
							Centralizar
						</button>
					</>
				)}
			</div>
		</div>
	);
}
