'use client';

import { ImageOff, Sparkles } from 'lucide-react';
import { type CSSProperties, useMemo, useState } from 'react';
import type { ToolBankEntry } from '../services/tool-bank.service';

/**
 * Galeria do Banco (cliente): grade de cards bonita (espelha a biblioteca de
 * vetores) — imagem de exemplo, título e categoria. Uma fileira de chips filtra
 * por categoria. Clicar num card escolhe o registro pra gerar. A cor de
 * destaque (chip ativo + hover/realce dos cards) vem da var `--screen-accent`
 * herdada do container (default fúcsia) — personalizável pela tela do cliente.
 */

function cardImage(entry: ToolBankEntry): string | null {
	return entry.example_after_url ?? entry.example_before_url ?? null;
}

/** Cor de destaque sólida (chip ativo). */
const ACCENT_BG: CSSProperties = { backgroundColor: 'var(--screen-accent)' };
/** Texto na cor de destaque ("Usar este" / categoria). */
const ACCENT_TEXT: CSSProperties = { color: 'var(--screen-accent)' };

export function ToolBankGallery({
	entries,
	onSelect,
}: {
	entries: ToolBankEntry[];
	onSelect: (entry: ToolBankEntry) => void;
}) {
	const [category, setCategory] = useState<string | null>(null);

	const categories = useMemo(() => {
		const set = new Set<string>();
		for (const e of entries) {
			if (e.category) set.add(e.category);
		}
		return [...set].sort((a, b) => a.localeCompare(b));
	}, [entries]);

	const shown = useMemo(
		() => (category ? entries.filter((e) => e.category === category) : entries),
		[entries, category],
	);

	if (entries.length === 0) {
		return (
			<div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 py-20 text-center">
				<Sparkles className="mx-auto mb-5 h-16 w-16 text-slate-300 dark:text-slate-600 opacity-60" />
				<p className="text-lg font-medium text-slate-600 dark:text-slate-400">
					Em breve, novos modelos
				</p>
				<p className="mt-2 text-sm text-slate-500 dark:text-slate-500">
					Nenhum item disponível ainda — volte logo.
				</p>
			</div>
		);
	}

	return (
		<div className="bank-gallery space-y-6">
			{/* Hover/realce dos cards na cor de destaque (não dá p/ inline em :hover). */}
			<style>{`
				.bank-gallery .bank-card:hover{border-color:color-mix(in srgb,var(--screen-accent) 40%,transparent);box-shadow:0 20px 25px -5px color-mix(in srgb,var(--screen-accent) 10%,transparent),0 8px 10px -6px color-mix(in srgb,var(--screen-accent) 10%,transparent)}
			`}</style>
			{categories.length > 0 && (
				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={() => setCategory(null)}
						style={category === null ? ACCENT_BG : undefined}
						className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
							category === null
								? 'text-white shadow-sm'
								: 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
						}`}
					>
						Todos
					</button>
					{categories.map((cat) => (
						<button
							key={cat}
							type="button"
							onClick={() => setCategory(cat)}
							style={category === cat ? ACCENT_BG : undefined}
							className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
								category === cat
									? 'text-white shadow-sm'
									: 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
							}`}
						>
							{cat}
						</button>
					))}
				</div>
			)}

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{shown.map((entry) => {
					const img = cardImage(entry);
					return (
						<button
							key={entry.id}
							type="button"
							onClick={() => onSelect(entry)}
							className="bank-card group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition-all duration-200 hover:-translate-y-1 dark:border-white/10 dark:bg-white/5"
						>
							<div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-white/5">
								{img ? (
									// <img> intencional: data URL / CDN dinâmico
									<img
										src={img}
										alt={entry.title}
										className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center">
										<div
											className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
											style={ACCENT_BG}
										>
											<Sparkles className="h-8 w-8 text-white" />
										</div>
									</div>
								)}
								{entry.category && (
									<span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
										{entry.category}
									</span>
								)}
							</div>
							<div className="flex flex-1 flex-col gap-1 p-4">
								<span className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-white">
									{entry.title}
								</span>
								{entry.description && (
									<span className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
										{entry.description}
									</span>
								)}
								<span
									className="mt-2 inline-flex items-center gap-1 text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100"
									style={ACCENT_TEXT}
								>
									Usar este <Sparkles className="h-3.5 w-3.5" />
								</span>
							</div>
						</button>
					);
				})}
			</div>

			{shown.length === 0 && (
				<div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-400 dark:border-white/10 dark:text-slate-500">
					<ImageOff className="mx-auto mb-3 h-8 w-8 opacity-50" />
					Nada nesta categoria.
				</div>
			)}
		</div>
	);
}
