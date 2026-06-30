'use client';

import { AlertCircle, ImageUp, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';

type BgMode = 'transparent' | 'white' | 'black';

const CHECKER =
	'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23f0f0f0%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23f0f0f0%22%2F%3E%3Crect%20x%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23e0e0e0%22%2F%3E%3Crect%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23e0e0e0%22%2F%3E%3C%2Fsvg%3E")]';

/**
 * Canvas de preview premium do Estúdio: moldura + toggle de fundo
 * (xadrez/branco/preto) + antes/depois (original × resultado) + skeleton no 1º
 * load + estado de erro (mantém a imagem anterior) + opacity ao recalcular.
 * Badge "ao vivo" só quando `livePreview`. Acento via `--screen-accent`.
 */
export function StudioPreview({
	originalUrl,
	liveSrc,
	resultPreview,
	isFetching,
	isError,
	livePreview,
	hasFile,
	meta,
}: {
	originalUrl: string | null;
	liveSrc: string | null;
	resultPreview: string | null;
	isFetching: boolean;
	isError: boolean;
	livePreview: boolean;
	hasFile: boolean;
	meta?: Record<string, unknown>;
}) {
	const [bg, setBg] = useState<BgMode>('transparent');
	const [showOriginal, setShowOriginal] = useState(false);

	const processed = livePreview
		? (liveSrc ?? resultPreview)
		: (resultPreview ?? null);
	const canvasSrc = showOriginal ? originalUrl : (processed ?? originalUrl);
	const canCompare = !!originalUrl && !!processed;
	// Skeleton só no 1º cálculo (tem foto, vai ter prévia, mas nada ainda).
	const firstLoad =
		hasFile && livePreview && isFetching && !liveSrc && !resultPreview;

	const bgClass = useMemo(() => {
		if (bg === 'white') return 'bg-white';
		if (bg === 'black') return 'bg-black';
		return CHECKER;
	}, [bg]);

	return (
		<div className="space-y-3">
			<div className="relative rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/5 dark:border-white/10 dark:bg-[#16161a] dark:shadow-black/40">
				<div
					className={`flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl ${bgClass}`}
				>
					{firstLoad ? (
						<div className="h-full w-full animate-pulse bg-slate-200/70 dark:bg-white/5" />
					) : canvasSrc ? (
						/* <img> intencional: data URL / blob de prévia dinâmica */
						<img
							src={canvasSrc}
							alt="Prévia"
							className={`max-h-full max-w-full object-contain transition-opacity duration-200 ${
								isFetching ? 'opacity-60' : 'opacity-100'
							}`}
						/>
					) : (
						<div className="px-6 text-center">
							<ImageUp className="mx-auto mb-2 h-10 w-10 text-slate-300 dark:text-gray-600" />
							<p className="text-sm text-slate-400 dark:text-gray-500">
								{livePreview
									? 'Envie uma foto para ver a prévia ao vivo.'
									: 'Envie uma foto, escolha a opção e gere.'}
							</p>
						</div>
					)}
				</div>

				{/* Badge de status (canto) */}
				{hasFile && livePreview && !showOriginal && (
					<div className="absolute left-6 top-6 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
						{isFetching ? (
							<>
								<Loader2 className="h-3 w-3 animate-spin" />
								Atualizando…
							</>
						) : (
							<>
								<span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
								Prévia ao vivo
							</>
						)}
					</div>
				)}
				{showOriginal && (
					<div className="absolute left-6 top-6 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
						Original
					</div>
				)}
				{isError && !firstLoad && (
					<div className="absolute right-6 top-6 flex items-center gap-1.5 rounded-full bg-rose-500/90 px-2.5 py-1 text-[11px] font-medium text-white">
						<AlertCircle className="h-3 w-3" />
						Falha na prévia
					</div>
				)}
			</div>

			{/* Barra: antes/depois + fundo */}
			{(canCompare || !!canvasSrc) && (
				<div className="flex flex-wrap items-center gap-2">
					{canCompare && (
						<div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-white/10">
							{[
								{ k: false, label: 'Resultado' },
								{ k: true, label: 'Original' },
							].map((o) => (
								<button
									key={o.label}
									type="button"
									onClick={() => setShowOriginal(o.k)}
									style={
										showOriginal === o.k
											? { backgroundColor: 'var(--screen-accent)' }
											: undefined
									}
									className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
										showOriginal === o.k
											? 'text-white'
											: 'text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-slate-200'
									}`}
								>
									{o.label}
								</button>
							))}
						</div>
					)}
					<span className="ml-auto text-xs text-slate-400 dark:text-gray-500">
						Fundo
					</span>
					<div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-white/10">
						{[
							{ k: 'transparent' as const, label: '▦' },
							{ k: 'white' as const, label: '◻' },
							{ k: 'black' as const, label: '◼' },
						].map((o) => (
							<button
								key={o.k}
								type="button"
								onClick={() => setBg(o.k)}
								style={
									bg === o.k
										? { backgroundColor: 'var(--screen-accent)' }
										: undefined
								}
								className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
									bg === o.k
										? 'text-white'
										: 'text-slate-500 hover:text-slate-700 dark:text-gray-400'
								}`}
							>
								{o.label}
							</button>
						))}
					</div>
				</div>
			)}

			{/* Meta (mm/dpi…) */}
			{meta && Object.keys(meta).length > 0 && (
				<div className="flex flex-wrap items-center gap-1.5">
					{Object.entries(meta).map(([k, v]) => (
						<span
							key={k}
							className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300"
						>
							{k}: {String(v)}
						</span>
					))}
				</div>
			)}
		</div>
	);
}
