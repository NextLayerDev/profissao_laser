'use client';

import { useEffect, useState } from 'react';

/**
 * Estado de espera HONESTO.
 *
 * Duas fases, e só uma delas tem porcentagem de verdade:
 *
 * - `enviando`: o número vem do `onUploadProgress` do axios — são bytes reais
 *   saindo do celular. É a parte lenta em 4G, e é a única que dá para medir.
 * - `calculando`: o servidor está lendo o desenho e precificando. Não existe
 *   canal de progresso, então NÃO INVENTAMOS UM. A barra vira indeterminada e o
 *   que cresce é o cronômetro — que é informação verdadeira, e é a que responde
 *   à pergunta real de quem espera ("travou ou está indo?"). Uma barra falsa
 *   subindo até 90% e parando é pior que spinner: mente com precisão.
 */

interface Props {
	fase: 'enviando' | 'calculando';
	/** 0–100 vindo do upload; `-1` quando o servidor não mandou `content-length`. */
	pctUpload: number;
	/** Instante em que o envio começou, para o cronômetro. */
	inicio: number;
}

/** A partir daqui vale avisar que está demorando mais do que o normal. */
const DEMORADO_MS = 12_000;

export function QuoteProgress({ fase, pctUpload, inicio }: Props) {
	const [agora, setAgora] = useState(() => Date.now());

	useEffect(() => {
		const id = setInterval(() => setAgora(Date.now()), 250);
		return () => clearInterval(id);
	}, []);

	const decorrido = Math.max(0, agora - inicio);
	const segundos = Math.floor(decorrido / 1000);
	const indeterminado = fase === 'calculando' || pctUpload < 0;

	const titulo =
		fase === 'enviando'
			? pctUpload < 0
				? 'Enviando seu arquivo…'
				: `Enviando seu arquivo — ${pctUpload}%`
			: 'Calculando o seu orçamento…';

	return (
		<output
			// `<output>` e não `div[role=alert]`: é progresso, não erro — o leitor de
			// tela anuncia sem interromper o que a pessoa está fazendo. O elemento já
			// traz `role="status"` implícito; `block` porque ele é inline por padrão.
			aria-live="polite"
			className="block rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#141416]"
		>
			<div className="flex items-baseline justify-between gap-3">
				<p className="text-sm font-medium text-slate-800 dark:text-slate-100">
					{titulo}
				</p>
				<span className="shrink-0 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
					{segundos}s
				</span>
			</div>

			<div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
				{indeterminado ? (
					<div className="h-full w-1/3 animate-[quote-slide_1.1s_ease-in-out_infinite] rounded-full bg-[var(--screen-accent,#7c3aed)]" />
				) : (
					<div
						className="h-full rounded-full bg-[var(--screen-accent,#7c3aed)] transition-[width] duration-200"
						style={{ width: `${Math.min(100, Math.max(0, pctUpload))}%` }}
					/>
				)}
			</div>

			<p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
				{fase === 'enviando'
					? 'Não feche a página. Em rede lenta o envio é a parte demorada.'
					: 'O servidor está abrindo o desenho, medindo cada peça e aplicando a tabela de preços do profissional.'}
			</p>

			{decorrido > DEMORADO_MS && fase === 'calculando' ? (
				<p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
					Desenho com muitos detalhes leva mais tempo. Continue aguardando —
					fechar a página agora não cancela nem repete nada.
				</p>
			) : null}

			<style>{`@keyframes quote-slide{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
		</output>
	);
}
