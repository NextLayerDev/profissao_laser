'use client';

import {
	ArrowRight,
	ImageIcon,
	ImageOff,
	Layers,
	ListChecks,
	Search,
	Sparkles,
	Type,
} from 'lucide-react';
import { type CSSProperties, type ReactNode, useMemo, useState } from 'react';
import {
	coverOf,
	maxImagesOf,
	modeLabel,
	modeOf,
	modeUsesImage,
} from '../lib/prompt-bank';
import type { ToolBankEntry } from '../services/tool-bank.service';

/**
 * Galeria premium dos "Prompts Mágicos" (Banco do Admin, lado cliente). Espelha
 * a qualidade da tela de Parâmetros: banda de stats, busca, chips de categoria,
 * grade de cards rica + sidebar contextual. A cor de destaque vem da CSS var
 * `--screen-accent` herdada do root (default fúcsia) — personalizável pela tela
 * do cliente. Funciona graciosamente com ZERO registros (preview/draft).
 */

/** Cor de destaque sólida (chip ativo / botões). */
const ACCENT_BG: CSSProperties = { backgroundColor: 'var(--screen-accent)' };
/** Texto na cor de destaque. */
const ACCENT_TEXT: CSSProperties = { color: 'var(--screen-accent)' };
/** Fundo tingido (icon boxes / realces suaves). */
const ACCENT_TINT: CSSProperties = {
	backgroundColor: 'color-mix(in srgb, var(--screen-accent) 12%, transparent)',
};

interface PromptGalleryProps {
	entries: ToolBankEntry[];
	loading: boolean;
	onSelect: (entry: ToolBankEntry) => void;
}

/* ─────────────────────────── Stats band ─────────────────────────── */

function PromptStatsBand({
	entries,
	loading,
}: {
	entries: ToolBankEntry[];
	loading: boolean;
}) {
	const stats = useMemo(() => {
		const categories = new Set<string>();
		let withImage = 0;
		for (const e of entries) {
			if (e.category) categories.add(e.category);
			if (modeUsesImage(modeOf(e))) withImage += 1;
		}
		return {
			prompts: entries.length,
			categorias: categories.size,
			comImagem: withImage,
		};
	}, [entries]);

	const cards: { label: string; value: number; icon: typeof Sparkles }[] = [
		{ label: 'Prompts', value: stats.prompts, icon: Sparkles },
		{ label: 'Categorias', value: stats.categorias, icon: Layers },
		{ label: 'Com imagem', value: stats.comImagem, icon: ImageIcon },
	];

	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
			{cards.map((c) => (
				<div
					key={c.label}
					className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#1a1a1d]"
				>
					<div
						className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl"
						style={ACCENT_TINT}
					>
						<c.icon className="h-4 w-4" style={ACCENT_TEXT} />
					</div>
					<p className="font-mono text-2xl font-bold text-slate-900 dark:text-white">
						{loading ? '—' : c.value.toLocaleString('pt-BR')}
					</p>
					<p className="text-xs text-slate-500 dark:text-gray-400">{c.label}</p>
				</div>
			))}
		</div>
	);
}

/* ─────────────────────────── Sidebar ─────────────────────────── */

function SidebarCard({
	title,
	icon: Icon,
	children,
}: {
	title: string;
	icon: typeof Sparkles;
	children: ReactNode;
}) {
	return (
		<div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#1a1a1d]">
			<h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
				<Icon className="h-4 w-4" style={ACCENT_TEXT} />
				{title}
			</h3>
			{children}
		</div>
	);
}

const HOW_STEPS = [
	'Escolha um prompt',
	'Personalize (tema e/ou imagens)',
	'Gere com IA',
];

/* ─────────────────────────── Card ─────────────────────────── */

function PromptCard({
	entry,
	onSelect,
}: {
	entry: ToolBankEntry;
	onSelect: (entry: ToolBankEntry) => void;
}) {
	const img = coverOf(entry);
	const mode = modeOf(entry);
	const maxImages = maxImagesOf(entry);
	const showsImage = modeUsesImage(mode);

	return (
		<button
			type="button"
			onClick={() => onSelect(entry)}
			className="prompt-card group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition-all duration-200 hover:-translate-y-1 dark:border-white/10 dark:bg-white/5"
		>
			<div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-white/5">
				{img ? (
					// <img> intencional: data URL / CDN dinâmico
					<img
						src={img}
						alt={entry.title}
						className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
						loading="lazy"
					/>
				) : (
					<div
						className="flex h-full w-full items-center justify-center"
						style={{
							background:
								'linear-gradient(135deg, color-mix(in srgb, var(--screen-accent) 22%, transparent), color-mix(in srgb, var(--screen-accent) 6%, transparent))',
						}}
					>
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

				<div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
					<span
						className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm"
						style={{
							backgroundColor:
								'color-mix(in srgb, var(--screen-accent) 78%, black)',
						}}
					>
						{modeLabel(mode)}
					</span>
					{showsImage && maxImages > 1 && (
						<span className="rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
							{maxImages} imagens
						</span>
					)}
				</div>
			</div>

			<div className="flex flex-1 flex-col gap-1 p-4">
				<span className="line-clamp-2 font-display text-sm font-bold text-slate-900 dark:text-white">
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
					Usar este <ArrowRight className="h-3.5 w-3.5" />
				</span>
			</div>
		</button>
	);
}

/* ─────────────────────────── Gallery ─────────────────────────── */

export function PromptGallery({
	entries,
	loading,
	onSelect,
}: PromptGalleryProps) {
	const [query, setQuery] = useState('');
	const [category, setCategory] = useState<string | null>(null);

	const categories = useMemo(() => {
		const counts = new Map<string, number>();
		for (const e of entries) {
			if (e.category) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
		}
		return [...counts.entries()]
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => a.name.localeCompare(b.name));
	}, [entries]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return entries.filter((e) => {
			if (category && e.category !== category) return false;
			if (!q) return true;
			const haystack = [e.title, e.description ?? '', e.category ?? '']
				.join(' ')
				.toLowerCase();
			return haystack.includes(q);
		});
	}, [entries, query, category]);

	const highlights = useMemo(() => entries.slice(0, 4), [entries]);

	return (
		<div className="prompt-gallery space-y-6">
			{/* Hover/realce dos cards na cor de destaque (não dá p/ inline em :hover). */}
			<style>{`
				.prompt-gallery .prompt-card:hover{border-color:color-mix(in srgb,var(--screen-accent) 45%,transparent);box-shadow:0 20px 25px -5px color-mix(in srgb,var(--screen-accent) 12%,transparent),0 8px 10px -6px color-mix(in srgb,var(--screen-accent) 10%,transparent)}
			`}</style>

			<PromptStatsBand entries={entries} loading={loading} />

			{/* Busca */}
			<div className="relative">
				<Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Buscar por título, descrição ou categoria..."
					className="h-12 w-full rounded-full border border-slate-200 bg-slate-100 pl-12 pr-4 text-slate-900 placeholder:text-slate-500 focus:border-[color-mix(in_srgb,var(--screen-accent)_50%,transparent)] focus:outline-none dark:border-white/10 dark:bg-[#1a1a1d] dark:text-white"
				/>
			</div>

			{/* Chips de categoria */}
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
							key={cat.name}
							type="button"
							onClick={() => setCategory(cat.name)}
							style={category === cat.name ? ACCENT_BG : undefined}
							className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
								category === cat.name
									? 'text-white shadow-sm'
									: 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
							}`}
						>
							{cat.name}
						</button>
					))}
				</div>
			)}

			{/* Layout: grade + sidebar */}
			<div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
				{/* Cards */}
				<div>
					{loading ? (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{Array.from({ length: 6 }).map((_, i) => (
								<PromptCardSkeleton key={i} />
							))}
						</div>
					) : entries.length === 0 ? (
						<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-20 text-center dark:border-white/10">
							<div
								className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
								style={ACCENT_TINT}
							>
								<Sparkles className="h-8 w-8" style={ACCENT_TEXT} />
							</div>
							<p className="text-lg font-medium text-slate-600 dark:text-slate-300">
								Nenhum prompt disponível ainda.
							</p>
							<p className="mt-2 text-sm text-slate-500 dark:text-slate-500">
								Em breve, novos modelos — volte logo.
							</p>
						</div>
					) : filtered.length === 0 ? (
						<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center text-slate-400 dark:border-white/10 dark:text-slate-500">
							<ImageOff className="mb-3 h-8 w-8 opacity-60" />
							<p className="text-sm font-medium">Nada nesta categoria/busca.</p>
							<p className="mt-1 text-xs">Tente ajustar a busca ou o filtro.</p>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{filtered.map((entry) => (
								<PromptCard key={entry.id} entry={entry} onSelect={onSelect} />
							))}
						</div>
					)}
				</div>

				{/* Sidebar */}
				<aside className="space-y-5">
					<SidebarCard title="Como funciona" icon={ListChecks}>
						<ol className="space-y-3">
							{HOW_STEPS.map((step, i) => (
								<li key={step} className="flex items-start gap-3">
									<span
										className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
										style={ACCENT_BG}
									>
										{i + 1}
									</span>
									<span className="text-sm text-slate-600 dark:text-slate-300">
										{step}
									</span>
								</li>
							))}
						</ol>
					</SidebarCard>

					{categories.length > 0 && (
						<SidebarCard title="Categorias" icon={Layers}>
							<div className="divide-y divide-slate-100 dark:divide-white/5">
								<button
									type="button"
									onClick={() => setCategory(null)}
									className="flex w-full items-center justify-between gap-2 py-1.5 text-left transition-colors hover:opacity-80"
								>
									<span className="truncate text-sm text-slate-700 dark:text-gray-300">
										Todos
									</span>
									<span className="text-xs font-semibold text-slate-400">
										{entries.length}
									</span>
								</button>
								{categories.map((cat) => (
									<button
										key={cat.name}
										type="button"
										onClick={() => setCategory(cat.name)}
										className="flex w-full items-center justify-between gap-2 py-1.5 text-left transition-colors hover:opacity-80"
									>
										<span
											className="truncate text-sm text-slate-700 dark:text-gray-300"
											style={category === cat.name ? ACCENT_TEXT : undefined}
										>
											{cat.name}
										</span>
										<span className="text-xs font-semibold text-slate-400">
											{cat.count}
										</span>
									</button>
								))}
							</div>
						</SidebarCard>
					)}

					{highlights.length > 0 && (
						<SidebarCard title="Comece por aqui" icon={Sparkles}>
							<div className="divide-y divide-slate-100 dark:divide-white/5">
								{highlights.map((entry) => {
									const mode = modeOf(entry);
									const Icon = modeUsesImage(mode) ? ImageIcon : Type;
									return (
										<button
											key={entry.id}
											type="button"
											onClick={() => onSelect(entry)}
											className="flex w-full items-center gap-2.5 py-2 text-left transition-colors hover:opacity-80"
										>
											<span
												className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
												style={ACCENT_TINT}
											>
												<Icon className="h-3.5 w-3.5" style={ACCENT_TEXT} />
											</span>
											<span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-gray-300">
												{entry.title}
											</span>
											<ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
										</button>
									);
								})}
							</div>
						</SidebarCard>
					)}
				</aside>
			</div>
		</div>
	);
}

/* ─────────────────────────── Skeleton ─────────────────────────── */

function PromptCardSkeleton() {
	return (
		<div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
			<div className="aspect-square animate-pulse bg-slate-200 dark:bg-white/5" />
			<div className="flex flex-col gap-2 p-4">
				<div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-white/5" />
				<div className="h-3 w-full animate-pulse rounded bg-slate-200 dark:bg-white/5" />
				<div className="h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-white/5" />
			</div>
		</div>
	);
}
