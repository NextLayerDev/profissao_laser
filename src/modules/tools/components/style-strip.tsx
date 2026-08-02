'use client';

import { useQuery } from '@tanstack/react-query';
import { Ban, Loader2 } from 'lucide-react';
import { listCollection } from '../services/collections.service';

/**
 * Tira horizontal de ESTILOS — a biblioteca que o admin alimenta na coleção
 * `estilos`. Escolher um estilo não muda o prompt do aluno: ele vira
 * `style_suffix` (cauda do prompt) e, quando o registro tiver, `style_system`
 * (substitui o system prompt naquela geração).
 *
 * Genérica de propósito: de onde vem cada campo é `canvas.styles.bind` na
 * definition, então trocar a coleção ou renomear um campo é edição de JSON.
 */

export interface StyleBind {
	style_suffix?: string;
	style_system?: string;
	cover?: string;
	label?: string;
}

export interface StyleChoice {
	id: string;
	label: string;
	cover?: string;
	suffix: string;
	system?: string;
}

/** Resolve um path (`data.sufixo`, `title`) num registro da coleção. */
function pick(
	entry: Record<string, unknown>,
	path?: string,
): string | undefined {
	if (!path) return undefined;
	const raw = path.startsWith('data.')
		? (entry.data as Record<string, unknown> | undefined)?.[path.slice(5)]
		: entry[path];
	const s = typeof raw === 'string' ? raw.trim() : '';
	return s || undefined;
}

export function StyleStrip({
	toolKey,
	collection,
	bind,
	selectedId,
	onSelect,
}: {
	toolKey: string;
	collection: string;
	bind: StyleBind;
	selectedId: string | null;
	onSelect: (choice: StyleChoice | null) => void;
}) {
	const query = useQuery({
		queryKey: ['collection', toolKey, collection, 'styles'],
		queryFn: () =>
			listCollection(toolKey, collection, { sort: 'position', pageSize: 60 }),
		staleTime: 5 * 60_000,
	});

	const choices: StyleChoice[] = (query.data?.items ?? [])
		.map((e): StyleChoice | null => {
			const entry = e as unknown as Record<string, unknown>;
			const suffix = pick(entry, bind.style_suffix ?? 'data.sufixo');
			// Estilo sem cauda de prompt não muda nada na geração — não vira card.
			if (!suffix) return null;
			return {
				id: e.id,
				label: pick(entry, bind.label ?? 'data.titulo') ?? e.title,
				cover: pick(entry, bind.cover ?? 'data.capa_url'),
				suffix,
				system: pick(entry, bind.style_system ?? 'data.system'),
			};
		})
		.filter((c): c is StyleChoice => c !== null);

	if (query.isLoading) {
		return (
			<div className="flex h-16 items-center gap-2 text-xs text-slate-400">
				<Loader2 className="h-3.5 w-3.5 animate-spin" />
				Carregando estilos…
			</div>
		);
	}
	// Biblioteca vazia não vira um espaço morto na tela: some.
	if (choices.length === 0) return null;

	return (
		<div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
			<button
				type="button"
				onClick={() => onSelect(null)}
				className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border text-[10px] font-medium transition-colors ${
					selectedId === null
						? 'border-transparent text-white'
						: 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-white/10 dark:text-gray-400'
				}`}
				style={
					selectedId === null
						? { backgroundColor: 'var(--screen-accent)' }
						: undefined
				}
			>
				<Ban className="h-4 w-4" />
				Nenhum
			</button>

			{choices.map((c) => {
				const active = c.id === selectedId;
				return (
					<button
						key={c.id}
						type="button"
						title={c.suffix}
						onClick={() => onSelect(active ? null : c)}
						className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border transition-colors ${
							active
								? 'border-transparent ring-2'
								: 'border-slate-200 hover:border-slate-300 dark:border-white/10'
						}`}
						style={
							active
								? ({
										'--tw-ring-color': 'var(--screen-accent)',
									} as React.CSSProperties)
								: undefined
						}
					>
						{c.cover ? (
							// <img> intencional: capa vinda de CDN dinâmico
							<img
								src={c.cover}
								alt={c.label}
								className="h-full w-full object-cover"
							/>
						) : (
							<span className="flex h-full w-full items-center justify-center bg-slate-100 px-1 text-center text-[10px] font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
								{c.label}
							</span>
						)}
						{c.cover && (
							<span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1 py-0.5 text-[9px] font-medium text-white">
								{c.label}
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}
