'use client';

import {
	Brush,
	Download,
	Grid3x3,
	Loader2,
	Maximize2,
	PenTool,
	RotateCcw,
	Scissors,
	Shuffle,
	Star,
	Trash2,
	X,
} from 'lucide-react';
import { useEffect } from 'react';
import { downloadUrl } from '../lib/prompt-bank';
import type { GalleryImage } from './gallery-grid';
import { TilePreview } from './tile-preview';

/**
 * Lightbox de uma imagem da galeria — e o LUGAR ONDE O CICLO ITERATIVO
 * ACONTECE.
 *
 * Cada ação daqui não executa nada sozinha: ela PRÉ-PREENCHE O COMPOSER com o
 * modo certo e com esta imagem como referência. É essa diferença que separa o
 * Estúdio dos Prompts Mágicos — lá o aluno escolhe um prompt do banco do admin
 * e recebe uma imagem; aqui ele pega o próprio resultado e continua trabalhando
 * em cima dele.
 *
 * A exceção é "Vetorizar", que roda no servidor (a imagem já está no storage) e
 * leva o aluno para a tela da Vetorização.
 */

export type LightboxAction =
	| 'variacao'
	| 'editar_mascara'
	| 'ampliar'
	| 'remover_fundo'
	| 'textura'
	| 'refazer';

interface Props {
	image: GalleryImage;
	onClose: () => void;
	/** Manda a imagem para o composer no modo escolhido. */
	onAction: (action: LightboxAction, image: GalleryImage) => void;
	onVectorize: (image: GalleryImage) => void;
	onToggleFavorite: (image: GalleryImage) => void;
	onDelete: (image: GalleryImage) => void;
	vectorizing: boolean;
	busy: boolean;
	modeLabel: (value: string) => string;
	tileRepeat: number;
}

export function ImageLightbox({
	image,
	onClose,
	onAction,
	onVectorize,
	onToggleFavorite,
	onDelete,
	vectorizing,
	busy,
	modeLabel,
	tileRepeat,
}: Props) {
	// Esc fecha. Sem isto o único jeito de sair é acertar o X — e o lightbox
	// ocupa a tela toda no celular.
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [onClose]);

	const actionBtn =
		'flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5';

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
			onClick={onClose}
			onKeyDown={(e) => {
				if (e.key === 'Enter') onClose();
			}}
			role="presentation"
		>
			<div
				className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white dark:bg-[#1a1a1d] lg:flex-row"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
				role="presentation"
			>
				<div className="flex min-h-0 flex-1 items-center justify-center bg-slate-100 p-3 dark:bg-[#111]">
					{/* <img> intencional: CDN dinâmico */}
					<img
						src={image.url}
						alt={image.title}
						className="max-h-[45vh] max-w-full object-contain lg:max-h-[80vh]"
					/>
				</div>

				<div className="flex w-full shrink-0 flex-col gap-4 overflow-y-auto p-4 lg:w-80">
					<div className="flex items-start justify-between gap-2">
						<div className="min-w-0">
							<p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
								{modeLabel(image.modo)}
							</p>
							<p className="mt-0.5 text-sm text-slate-700 dark:text-slate-200">
								{image.prompt || image.title}
							</p>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
						>
							<X className="h-4 w-4" />
						</button>
					</div>

					<div className="flex flex-wrap gap-1.5 text-[11px]">
						{image.largura && image.altura && (
							<span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500 dark:bg-white/5 dark:text-slate-400">
								{image.largura}×{image.altura}
							</span>
						)}
						{image.aspecto && (
							<span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500 dark:bg-white/5 dark:text-slate-400">
								{image.aspecto}
							</span>
						)}
						{image.vectorReady && (
							<span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
								pronta p/ vetor
							</span>
						)}
						{image.tileable && (
							<span className="rounded-full bg-sky-100 px-2 py-0.5 font-medium text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
								repetível
							</span>
						)}
					</div>

					{image.tileable && (
						<TilePreview url={image.url} repeat={tileRepeat} />
					)}

					{/* A ponte que fecha o produto — em destaque, sozinha. */}
					<button
						type="button"
						disabled={vectorizing || busy}
						onClick={() => onVectorize(image)}
						className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
						style={{ backgroundColor: 'var(--screen-accent)' }}
					>
						{vectorizing ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Scissors className="h-4 w-4" />
						)}
						Vetorizar para corte
					</button>
					{!image.vectorReady && (
						<p className="-mt-2 text-[11px] text-slate-400">
							Imagem com cor e sombra passa antes por um redesenho em preto e
							branco. Para o traço mais limpo, gere no modo “Arte vetorizável”.
						</p>
					)}

					<div className="grid grid-cols-2 gap-2">
						<button
							type="button"
							disabled={busy}
							onClick={() => onAction('variacao', image)}
							className={actionBtn}
						>
							<Shuffle className="h-3.5 w-3.5" />
							Variar
						</button>
						<button
							type="button"
							disabled={busy}
							onClick={() => onAction('editar_mascara', image)}
							className={actionBtn}
						>
							<Brush className="h-3.5 w-3.5" />
							Editar
						</button>
						<button
							type="button"
							disabled={busy}
							onClick={() => onAction('ampliar', image)}
							className={actionBtn}
						>
							<Maximize2 className="h-3.5 w-3.5" />
							Ampliar
						</button>
						<button
							type="button"
							disabled={busy}
							onClick={() => onAction('remover_fundo', image)}
							className={actionBtn}
						>
							<Scissors className="h-3.5 w-3.5" />
							Tirar fundo
						</button>
						<button
							type="button"
							disabled={busy}
							onClick={() => onAction('textura', image)}
							className={actionBtn}
						>
							<Grid3x3 className="h-3.5 w-3.5" />
							Tornar tileável
						</button>
						<button
							type="button"
							disabled={busy || !image.prompt}
							title={
								image.prompt
									? 'Volta o prompt original para o composer'
									: 'Esta imagem não guardou prompt (ampliar/remover fundo)'
							}
							onClick={() => onAction('refazer', image)}
							className={actionBtn}
						>
							<RotateCcw className="h-3.5 w-3.5" />
							Refazer
						</button>
					</div>

					<div className="mt-auto flex flex-wrap gap-2 border-t border-slate-200 pt-3 dark:border-white/10">
						<button
							type="button"
							onClick={() => downloadUrl(image.url, image.title || 'imagem')}
							className={actionBtn}
						>
							<Download className="h-3.5 w-3.5" />
							Baixar
						</button>
						<button
							type="button"
							onClick={() => onToggleFavorite(image)}
							className={actionBtn}
						>
							<Star
								className={`h-3.5 w-3.5 ${image.favorito ? 'fill-amber-400 text-amber-400' : ''}`}
							/>
							{image.favorito ? 'Desfavoritar' : 'Favoritar'}
						</button>
						<button
							type="button"
							onClick={() => onDelete(image)}
							className={`${actionBtn} !text-rose-600 dark:!text-rose-400`}
						>
							<Trash2 className="h-3.5 w-3.5" />
							Excluir
						</button>
					</div>

					{image.parentId && (
						<p className="flex items-center gap-1.5 text-[11px] text-slate-400">
							<PenTool className="h-3 w-3" />
							Gerada a partir de outra imagem da galeria.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
