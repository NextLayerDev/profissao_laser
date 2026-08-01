'use client';

import { Loader2, Pause, Play, RotateCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Mesa giratória: N PNGs isométricos onde o índice do quadro segue o arraste
 * horizontal. É "3D" do ponto de vista de quem aprova a peça.
 *
 * Por que isto antes do three.js: custa 0 KB de bundle, roda em celular fraco,
 * abre instantâneo e já entrega o requisito literal ("ver o modelo por todos os
 * lados antes de cortar"). O visualizador WebGL é o passo seguinte, não o
 * primeiro — e continua valendo para quem tem máquina boa.
 *
 * Os quadros são pré-carregados ANTES de começar a girar: sem isso o primeiro
 * giro busca imagem na rede quadro a quadro e a peça pisca, que é exatamente a
 * impressão de "travando" que a mesa giratória existe para evitar.
 */

interface Props {
	/** URLs (ou data URLs) dos quadros, em ordem de rotação. */
	frames: string[];
	/** Gira sozinho até o primeiro toque. */
	autoRotate?: boolean;
}

/** Quadros por segundo da autorotação: acima disso o giro fica nervoso. */
const FPS = 12;

export function TurntableViewport({ frames, autoRotate = true }: Props) {
	const hostRef = useRef<HTMLDivElement>(null);
	const [indice, setIndice] = useState(0);
	const [carregados, setCarregados] = useState(0);
	const [girando, setGirando] = useState(autoRotate);
	const [arrastando, setArrastando] = useState(false);
	const arraste = useRef({ x: 0, indice: 0 });

	const total = frames.length;
	const pronto = total > 0 && carregados >= total;

	// Pré-carga: só depois que TODOS os quadros estão no cache o giro é fluido.
	useEffect(() => {
		let cancelado = false;
		setCarregados(0);
		const imgs: HTMLImageElement[] = [];
		for (const src of frames) {
			const img = new Image();
			// Erro conta como resolvido de propósito: um quadro quebrado não pode
			// deixar a barra de progresso presa em 90% para sempre.
			const feito = () => {
				if (!cancelado) setCarregados((n) => n + 1);
			};
			img.onload = feito;
			img.onerror = feito;
			img.src = src;
			imgs.push(img);
		}
		return () => {
			cancelado = true;
			for (const img of imgs) {
				img.onload = null;
				img.onerror = null;
			}
		};
	}, [frames]);

	// Autorotação em rAF (não em setInterval): aba em segundo plano congela o rAF
	// sozinha, então a mesa não fica queimando CPU do celular no bolso.
	useEffect(() => {
		if (!girando || !pronto || total < 2) return;
		let raf = 0;
		let ultimo = performance.now();
		let acumulado = 0;
		const passo = 1000 / FPS;
		const tick = (agora: number) => {
			acumulado += agora - ultimo;
			ultimo = agora;
			if (acumulado >= passo) {
				acumulado = 0;
				setIndice((i) => (i + 1) % total);
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [girando, pronto, total]);

	const irPara = useCallback(
		(n: number) => {
			if (total < 1) return;
			setIndice(((n % total) + total) % total);
		},
		[total],
	);

	const onPointerDown = (e: React.PointerEvent) => {
		if (total < 2) return;
		setGirando(false);
		setArrastando(true);
		arraste.current = { x: e.clientX, indice };
		(e.currentTarget as Element).setPointerCapture?.(e.pointerId);
	};

	const onPointerMove = (e: React.PointerEvent) => {
		if (!arrastando) return;
		const largura = hostRef.current?.clientWidth ?? 1;
		// Uma travessia da largura do viewport = uma volta completa. É a relação
		// que faz o arraste parecer que a mão está girando a peça, não um slider.
		const passos = Math.round(
			((e.clientX - arraste.current.x) / largura) * total,
		);
		irPara(arraste.current.indice + passos);
	};

	const encerraArraste = () => setArrastando(false);

	const onKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'ArrowLeft') irPara(indice - 1);
		else if (e.key === 'ArrowRight') irPara(indice + 1);
		else if (e.key === ' ' || e.key === 'Enter') setGirando((v) => !v);
		else return;
		if (e.key !== ' ' && e.key !== 'Enter') setGirando(false);
		e.preventDefault();
	};

	if (total === 0) {
		return (
			<div className="flex h-[clamp(360px,62vh,720px)] w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-center dark:border-white/10 dark:bg-[#111]">
				<p className="text-sm text-slate-400 dark:text-gray-500">
					Gere a peça para ver o modelo girando.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-0">
			<div
				ref={hostRef}
				// `application` + tabIndex: o viewport É um widget de navegação por
				// teclado (setas giram), não conteúdo estático.
				role="application"
				aria-label="Modelo giratório. Arraste na horizontal ou use as setas para girar."
				// biome-ignore lint/a11y/noNoninteractiveTabindex: widget de navegação por teclado
				tabIndex={0}
				onKeyDown={onKeyDown}
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={encerraArraste}
				onPointerCancel={encerraArraste}
				onPointerLeave={encerraArraste}
				className={`relative h-[clamp(360px,62vh,720px)] w-full touch-pan-y select-none overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--screen-accent,#7c3aed)_45%,transparent)] dark:border-white/10 dark:bg-[#111] dark:shadow-black/40 ${
					arrastando ? 'cursor-grabbing' : 'cursor-grab'
				}`}
			>
				{/* Todos os quadros ficam montados e só a opacidade troca: swap de
				    `src` redecodifica a imagem e pisca branco entre um quadro e outro. */}
				<div className="absolute inset-0 flex items-center justify-center">
					{frames.map((src, i) => (
						<img
							key={src}
							src={src}
							alt={i === indice ? `Modelo, quadro ${i + 1} de ${total}` : ''}
							aria-hidden={i !== indice}
							draggable={false}
							className="absolute max-h-full max-w-full object-contain"
							style={{ opacity: i === indice ? 1 : 0 }}
						/>
					))}
				</div>

				{!pronto ? (
					<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-sm dark:bg-black/60">
						<Loader2 className="h-6 w-6 animate-spin text-slate-400" />
						<div className="h-1 w-40 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
							<div
								className="h-full rounded-full bg-[var(--screen-accent,#7c3aed)] transition-[width] duration-150"
								style={{ width: `${Math.round((carregados / total) * 100)}%` }}
							/>
						</div>
						<p className="font-mono text-[11px] tabular-nums text-slate-500">
							{carregados}/{total} quadros
						</p>
					</div>
				) : null}

				<div className="absolute left-3 top-3 flex gap-1">
					<button
						type="button"
						aria-label={girando ? 'Parar giro' : 'Girar'}
						aria-pressed={girando}
						onClick={() => setGirando((v) => !v)}
						className="rounded-lg border border-slate-200 bg-white/90 p-1.5 backdrop-blur dark:border-white/10 dark:bg-black/50"
					>
						{girando ? (
							<Pause className="h-3.5 w-3.5" />
						) : (
							<Play className="h-3.5 w-3.5" />
						)}
					</button>
					<button
						type="button"
						aria-label="Voltar ao quadro inicial"
						onClick={() => irPara(0)}
						className="rounded-lg border border-slate-200 bg-white/90 p-1.5 backdrop-blur dark:border-white/10 dark:bg-black/50"
					>
						<RotateCw className="h-3.5 w-3.5" />
					</button>
				</div>

				{pronto && !arrastando && girando ? (
					<p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/70 px-3 py-1 text-[11px] text-white backdrop-blur">
						Arraste para girar
					</p>
				) : null}
			</div>

			<div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-200 px-1 py-2 font-mono text-[11px] tabular-nums text-slate-500 dark:border-white/10">
				<span>modelo · {total} quadros</span>
				<span className="ml-auto">
					{indice + 1}/{total}
				</span>
			</div>
		</div>
	);
}
