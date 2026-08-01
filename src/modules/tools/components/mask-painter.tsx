'use client';

import { Eraser, Paintbrush, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Pincel de MÁSCARA para o modo "editar com máscara".
 *
 * CONTRATO COM O MOTOR (`editor-ai`): PNG do mesmo tamanho da imagem, BRANCO
 * onde repintar e PRETO onde preservar. Nada de alfa, nada de cinza — a máscara
 * é binária do lado de lá.
 *
 * CANVAS CRU, NÃO FABRIC: o `fabric` está nas dependências e pesa ~300 KB
 * gzipados. Ele resolve seleção, transformação e serialização de objetos —
 * nenhum dos três aparece aqui. O que precisamos é pintar disco branco e
 * apagar, que é `arc()` + `globalCompositeOperation`. Trazer um motor de cena
 * inteiro para isso seria pagar meio megabyte por açúcar sintático.
 *
 * DOIS CANVAS SOBREPOSTOS:
 *  - o de baixo (`<img>`) mostra a arte, só para a pessoa saber onde pinta;
 *  - o de cima guarda a máscara com ALFA (para o traço aparecer translúcido
 *    sobre a arte). Na exportação, o alfa é achatado sobre preto e binarizado —
 *    é aí que a máscara vira o preto-e-branco que o back espera.
 */

/** Lado máximo do canvas de trabalho. A máscara é exportada no tamanho real. */
const MAX_CANVAS_SIDE = 1024;

interface Props {
	/** Imagem base (object URL ou http). */
	imageUrl: string;
	/** Chamado a cada traço concluído com o PNG da máscara (ou `null` se vazia). */
	onChange: (mask: File | null) => void;
}

export function MaskPainter({ imageUrl, onChange }: Props) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [size, setSize] = useState<{ w: number; h: number } | null>(null);
	const [radius, setRadius] = useState(40);
	const [erasing, setErasing] = useState(false);
	const [painted, setPainted] = useState(false);
	const drawing = useRef(false);
	const last = useRef<{ x: number; y: number } | null>(null);

	// Dimensiona o canvas pela imagem (limitado), preservando a proporção — a
	// máscara precisa casar com a arte pixel a pixel depois do reescalonamento.
	useEffect(() => {
		let cancelled = false;
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => {
			if (cancelled) return;
			const scale = Math.min(
				1,
				MAX_CANVAS_SIDE / Math.max(img.naturalWidth, img.naturalHeight),
			);
			setSize({
				w: Math.max(1, Math.round(img.naturalWidth * scale)),
				h: Math.max(1, Math.round(img.naturalHeight * scale)),
			});
		};
		img.src = imageUrl;
		return () => {
			cancelled = true;
		};
	}, [imageUrl]);

	/**
	 * Achata o traço (RGBA) numa máscara BINÁRIA sobre fundo preto. Sem este
	 * passo o back receberia um PNG com alfa, e alfa não é o contrato: a borda
	 * suave do pincel viraria cinza, e cinza numa máscara é território
	 * indefinido — cada modelo interpreta de um jeito.
	 */
	const exportMask = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const out = document.createElement('canvas');
		out.width = canvas.width;
		out.height = canvas.height;
		const ctx = out.getContext('2d');
		if (!ctx) return;
		ctx.fillStyle = '#000';
		ctx.fillRect(0, 0, out.width, out.height);
		ctx.drawImage(canvas, 0, 0);

		const img = ctx.getImageData(0, 0, out.width, out.height);
		let any = false;
		for (let i = 0; i < img.data.length; i += 4) {
			const on = img.data[i] > 127;
			if (on) any = true;
			const v = on ? 255 : 0;
			img.data[i] = v;
			img.data[i + 1] = v;
			img.data[i + 2] = v;
			img.data[i + 3] = 255;
		}
		ctx.putImageData(img, 0, 0);

		if (!any) {
			onChange(null);
			return;
		}
		out.toBlob((blob) => {
			if (blob)
				onChange(new File([blob], 'mascara.png', { type: 'image/png' }));
		}, 'image/png');
	}, [onChange]);

	const pointAt = (e: React.PointerEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return null;
		const rect = canvas.getBoundingClientRect();
		// O canvas é exibido em CSS pixels e desenhado em pixels de imagem — sem
		// esta conversão, o traço sai deslocado em qualquer tela que não seja 1:1.
		return {
			x: ((e.clientX - rect.left) / rect.width) * canvas.width,
			y: ((e.clientY - rect.top) / rect.height) * canvas.height,
		};
	};

	const stroke = (
		from: { x: number; y: number } | null,
		to: {
			x: number;
			y: number;
		},
	) => {
		const ctx = canvasRef.current?.getContext('2d');
		if (!ctx) return;
		// `destination-out` = borracha de verdade (remove o que já foi pintado),
		// em vez de "pintar de preto por cima", que deixaria um buraco preto na
		// exportação em vez de área preservada.
		ctx.globalCompositeOperation = erasing ? 'destination-out' : 'source-over';
		ctx.strokeStyle = 'rgba(255,255,255,0.9)';
		ctx.fillStyle = 'rgba(255,255,255,0.9)';
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.lineWidth = radius * 2;
		if (from) {
			ctx.beginPath();
			ctx.moveTo(from.x, from.y);
			ctx.lineTo(to.x, to.y);
			ctx.stroke();
		}
		ctx.beginPath();
		ctx.arc(to.x, to.y, radius, 0, Math.PI * 2);
		ctx.fill();
		setPainted(true);
	};

	const clear = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext('2d');
		if (!canvas || !ctx) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		setPainted(false);
		onChange(null);
	};

	const btn =
		'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors';

	return (
		<div className="space-y-3">
			<div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-[#111]">
				{/* <img> intencional: base vinda do CDN/blob, sem otimização do Next */}
				<img
					src={imageUrl}
					alt="Imagem para editar"
					className="block w-full select-none"
					draggable={false}
				/>
				{size && (
					<canvas
						ref={canvasRef}
						width={size.w}
						height={size.h}
						className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
						onPointerDown={(e) => {
							e.currentTarget.setPointerCapture(e.pointerId);
							drawing.current = true;
							const p = pointAt(e);
							if (p) {
								stroke(null, p);
								last.current = p;
							}
						}}
						onPointerMove={(e) => {
							if (!drawing.current) return;
							const p = pointAt(e);
							if (p) {
								stroke(last.current, p);
								last.current = p;
							}
						}}
						onPointerUp={() => {
							drawing.current = false;
							last.current = null;
							// Exporta no FIM do traço, não a cada ponto: `getImageData` +
							// `toBlob` num canvas de 1024² a 60 fps travaria a mão.
							exportMask();
						}}
						onPointerLeave={() => {
							if (!drawing.current) return;
							drawing.current = false;
							last.current = null;
							exportMask();
						}}
					/>
				)}
			</div>

			<div className="flex flex-wrap items-center gap-2">
				<button
					type="button"
					onClick={() => setErasing(false)}
					className={`${btn} ${
						erasing
							? 'border-slate-200 text-slate-500 dark:border-white/10 dark:text-gray-400'
							: 'border-transparent text-white'
					}`}
					style={
						erasing ? undefined : { backgroundColor: 'var(--screen-accent)' }
					}
				>
					<Paintbrush className="h-3.5 w-3.5" />
					Pintar
				</button>
				<button
					type="button"
					onClick={() => setErasing(true)}
					className={`${btn} ${
						erasing
							? 'border-transparent text-white'
							: 'border-slate-200 text-slate-500 dark:border-white/10 dark:text-gray-400'
					}`}
					style={
						erasing ? { backgroundColor: 'var(--screen-accent)' } : undefined
					}
				>
					<Eraser className="h-3.5 w-3.5" />
					Apagar
				</button>
				<button
					type="button"
					onClick={clear}
					className={`${btn} border-slate-200 text-slate-500 dark:border-white/10 dark:text-gray-400`}
				>
					<RotateCcw className="h-3.5 w-3.5" />
					Limpar
				</button>

				<label className="ml-auto flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
					Pincel
					<input
						type="range"
						min={5}
						max={160}
						value={radius}
						onChange={(e) => setRadius(Number(e.target.value))}
						className="w-28 accent-[var(--screen-accent)]"
					/>
					<span className="w-8 tabular-nums">{radius}</span>
				</label>
			</div>

			<p className="text-xs text-slate-500 dark:text-gray-400">
				{painted
					? 'Pintado: só o que está marcado será refeito.'
					: 'Pinte o que deve ser refeito. Sem pintar nada, a IA edita a imagem inteira.'}
			</p>
		</div>
	);
}
