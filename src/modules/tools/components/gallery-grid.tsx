'use client';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { ImageOff, Loader2, Search, Star } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	type CollectionEntry,
	listCollection,
} from '../services/collections.service';

/**
 * A GALERIA PESSOAL — grade masonry com histórico infinito.
 *
 * Não existe tabela de galeria: isto é a coleção `galeria` da tool, com
 * `visibility:'owner'`. O back já devolve só o que é do dono, e `mine` reforça
 * (staff veria a galeria de todo mundo sem isso).
 */

const PAGE_SIZE = 24;

/** Um registro da galeria com os campos que a tela usa, já resolvidos. */
export interface GalleryImage {
	id: string;
	title: string;
	url: string;
	thumb: string;
	modo: string;
	prompt: string;
	aspecto: string;
	largura: number | null;
	altura: number | null;
	favorito: boolean;
	vectorReady: boolean;
	tileable: boolean;
	parentId: string | null;
	createdAt: string;
	/**
	 * O MP4 do anúncio em vídeo, quando a arte tem um.
	 *
	 * Campo próprio e não `url`: aquele alimenta o `<img>` da grade e o download
	 * da imagem. Vazio é o estado normal — a maioria das artes não tem vídeo.
	 */
	videoUrl: string;
}

function str(v: unknown): string {
	return typeof v === 'string' ? v : '';
}
function num(v: unknown): number | null {
	return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export function toGalleryImage(entry: CollectionEntry): GalleryImage {
	const d = entry.data ?? {};
	const url = str(d.url);
	return {
		id: entry.id,
		title: entry.title,
		url,
		// Miniatura ausente (upload do thumb falhou) cai na imagem cheia: pior
		// para a banda, melhor do que um buraco na grade.
		thumb: str(d.thumb_url) || url,
		modo: str(d.modo),
		prompt: str(d.prompt),
		aspecto: str(d.aspecto),
		largura: num(d.largura),
		altura: num(d.altura),
		favorito: d.favorito === true,
		vectorReady: d.vector_ready === true,
		tileable: d.tileable === true,
		parentId: str(d.parent_id) || null,
		videoUrl: str(d.video_url),
		createdAt: str((entry as unknown as Record<string, unknown>).created_at),
	};
}

export interface GalleryFilters {
	/** `''` = tudo. */
	modo: string;
	favoritos: boolean;
	q: string;
}

export function useGallery(
	toolKey: string,
	collection: string,
	filters: GalleryFilters,
	enabled = true,
) {
	const qc = useQueryClient();
	const key = ['gallery', toolKey, collection, filters] as const;

	const query = useInfiniteQuery({
		queryKey: key,
		enabled,
		initialPageParam: 1,
		queryFn: ({ pageParam }) =>
			listCollection(toolKey, collection, {
				page: pageParam,
				pageSize: PAGE_SIZE,
				sort: 'recent',
				mine: true,
				q: filters.q.trim() || undefined,
				filters: {
					...(filters.modo
						? { modo: { kind: 'eq' as const, value: filters.modo } }
						: {}),
					...(filters.favoritos
						? { favorito: { kind: 'eq' as const, value: 'true' } }
						: {}),
				},
			}),
		getNextPageParam: (last) =>
			last.page < last.pages ? last.page + 1 : undefined,
		staleTime: 30_000,
	});

	const images = useMemo(
		() =>
			(query.data?.pages ?? [])
				.flatMap((p) => p.items)
				.map(toGalleryImage)
				// Registro sem arquivo (upload falhou no `save_gallery`) não vira card
				// vazio: some da grade.
				.filter((i) => !!i.url),
		[query.data],
	);

	/** Invalida TODA a galeria desta tool (qualquer combinação de filtro). */
	const invalidate = useCallback(() => {
		qc.invalidateQueries({ queryKey: ['gallery', toolKey, collection] });
	}, [qc, toolKey, collection]);

	return { ...query, images, invalidate };
}

/* ─────────────────────────── grade ─────────────────────────── */

interface Props {
	images: GalleryImage[];
	loading: boolean;
	/** Uma vaga animada por imagem do lote em andamento. */
	placeholders: number;
	hasNextPage: boolean;
	fetchingNextPage: boolean;
	onLoadMore: () => void;
	onOpen: (image: GalleryImage) => void;
	filters: GalleryFilters;
	onFilters: (f: GalleryFilters) => void;
	/** `value → rótulo` dos modos, vindo da definition. */
	modeLabels: { value: string; label: string }[];
}

export function GalleryGrid({
	images,
	loading,
	placeholders,
	hasNextPage,
	fetchingNextPage,
	onLoadMore,
	onOpen,
	filters,
	onFilters,
	modeLabels,
}: Props) {
	const sentinel = useRef<HTMLDivElement>(null);
	const [term, setTerm] = useState(filters.q);

	// Busca com debounce: cada tecla dispararia uma query nova (e o back faz
	// `ilike` em dois campos).
	useEffect(() => {
		const id = window.setTimeout(() => {
			if (term !== filters.q) onFilters({ ...filters, q: term });
		}, 350);
		return () => window.clearTimeout(id);
	}, [term, filters, onFilters]);

	// Scroll infinito por IntersectionObserver — sem botão "carregar mais" e sem
	// listener de scroll (que dispararia dezenas de vezes por segundo).
	useEffect(() => {
		const el = sentinel.current;
		if (!el || !hasNextPage) return;
		const io = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) onLoadMore();
			},
			{ rootMargin: '400px' },
		);
		io.observe(el);
		return () => io.disconnect();
	}, [hasNextPage, onLoadMore]);

	const chip = (active: boolean) =>
		`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
			active
				? 'text-white'
				: 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
		}`;
	const chipStyle = (active: boolean) =>
		active ? { backgroundColor: 'var(--screen-accent)' } : undefined;

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center gap-2">
				<button
					type="button"
					onClick={() => onFilters({ ...filters, modo: '', favoritos: false })}
					className={chip(!filters.modo && !filters.favoritos)}
					style={chipStyle(!filters.modo && !filters.favoritos)}
				>
					Tudo
				</button>
				<button
					type="button"
					onClick={() =>
						onFilters({ ...filters, favoritos: !filters.favoritos })
					}
					className={`${chip(filters.favoritos)} flex items-center gap-1`}
					style={chipStyle(filters.favoritos)}
				>
					<Star
						className={`h-3.5 w-3.5 ${filters.favoritos ? 'fill-current' : ''}`}
					/>
					Favoritos
				</button>
				{modeLabels.map((m) => (
					<button
						key={m.value}
						type="button"
						onClick={() =>
							onFilters({
								...filters,
								modo: filters.modo === m.value ? '' : m.value,
							})
						}
						className={chip(filters.modo === m.value)}
						style={chipStyle(filters.modo === m.value)}
					>
						{m.label}
					</button>
				))}

				<label className="ml-auto flex min-w-[180px] flex-1 items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 dark:border-white/10 sm:max-w-xs sm:flex-none">
					<Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
					<input
						value={term}
						onChange={(e) => setTerm(e.target.value)}
						placeholder="Buscar no prompt…"
						className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"
					/>
				</label>
			</div>

			{/* Masonry por CSS columns: sem medir altura, sem biblioteca, e a
			    proporção original de cada imagem é preservada. */}
			<div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
				{Array.from({ length: placeholders }).map((_, i) => (
					<div
						key={`ph-${i}`}
						className="flex aspect-square w-full animate-pulse items-center justify-center break-inside-avoid rounded-xl bg-slate-100 dark:bg-white/5"
					>
						<Loader2 className="h-5 w-5 animate-spin text-slate-400" />
					</div>
				))}

				{images.map((img) => (
					<button
						key={img.id}
						type="button"
						onClick={() => onOpen(img)}
						className="group relative block w-full break-inside-avoid overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-left transition-transform hover:scale-[1.01] dark:border-white/10 dark:bg-white/5"
					>
						{/* <img> intencional: CDN dinâmico, proporção variável */}
						<img
							src={img.thumb}
							alt={img.title}
							loading="lazy"
							className="block w-full"
						/>
						{img.favorito && (
							<Star className="absolute right-2 top-2 h-4 w-4 fill-amber-400 text-amber-400 drop-shadow" />
						)}
						<span className="pointer-events-none absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-black/75 to-transparent px-2 pb-2 pt-6 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
							{img.prompt || img.title}
						</span>
					</button>
				))}
			</div>

			{loading && images.length === 0 && placeholders === 0 && (
				<div className="flex justify-center py-10">
					<Loader2 className="h-5 w-5 animate-spin text-slate-400" />
				</div>
			)}

			{!loading && images.length === 0 && placeholders === 0 && (
				<div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 py-12 text-center dark:border-white/10">
					<ImageOff className="h-6 w-6 text-slate-300" />
					<p className="text-sm font-medium text-slate-600 dark:text-slate-300">
						{filters.q || filters.modo || filters.favoritos
							? 'Nada com esse filtro.'
							: 'Sua galeria está vazia.'}
					</p>
					<p className="text-xs text-slate-400">
						Escreva o que você quer lá em cima e clique em Gerar.
					</p>
				</div>
			)}

			<div ref={sentinel} className="h-1" />
			{fetchingNextPage && (
				<div className="flex justify-center py-4">
					<Loader2 className="h-4 w-4 animate-spin text-slate-400" />
				</div>
			)}
		</div>
	);
}
