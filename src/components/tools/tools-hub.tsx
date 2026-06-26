'use client';

import {
	BarChart3,
	FolderTree,
	Loader2,
	Search,
	Star,
	Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useMemo, useState } from 'react';
import { usePermissions } from '@/modules/access';
import { usePinnedTools } from '@/modules/tools/hooks/use-pinned-tools';
import {
	type CatalogTool,
	useToolCatalog,
} from '@/modules/tools/hooks/use-tool-catalog';
import { categoryById } from '@/modules/tools/lib/tool-categories';
import { TOOL_COLORS } from '@/utils/constants/tool-colors';

/**
 * HUB de ferramentas (página dedicada) — o "catálogo infinito" inteiro do
 * público, sem o gargalo da sidebar (que só mostra os PINS). Consome o ÚNICO
 * catálogo gateado (`useToolCatalog`), então NÃO reimplementa gating: o que
 * aparece aqui já passou pelo super-admin (admin) / entitlements (aluno).
 *
 * Layout: busca no topo (título/descrição/categoria) + tools agrupadas por
 * CATEGORIA com header, cada uma num card colorido (gradiente da paleta única
 * herdado da categoria) que leva à `tool.href`. Cada card tem o toggle de PIN
 * (estrela) — fixa/desfixa na sidebar via `usePinnedTools(audience)`.
 */

interface ToolsHubProps {
	audience: 'admin' | 'student';
}

const COPY = {
	admin: {
		title: 'Ferramentas',
		subtitle: 'Todo o catálogo da Fábrica — fixe as favoritas no menu.',
	},
	student: {
		title: 'Ferramentas',
		subtitle: 'Tudo que o seu plano libera — fixe as favoritas no menu.',
	},
} as const;

function normalize(value: string): string {
	return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function ToolsHub({ audience }: ToolsHubProps) {
	const { tools, isLoading } = useToolCatalog(audience);
	const { can } = usePermissions();
	// Atalho p/ o dashboard de uso — só pra quem pode gerir ferramentas.
	const canSeeAnalytics = can('tools.build');

	// Defaults dos pins = espelham a sidebar (3 primeiras por ordem), pra estrela
	// já vir marcada nas mesmas que o menu mostra antes de o usuário customizar.
	const defaults = useMemo(() => tools.slice(0, 3).map((t) => t.key), [tools]);
	const { isPinned, toggle, isReady } = usePinnedTools(audience, defaults);

	const [query, setQuery] = useState('');

	const filtered = useMemo(() => {
		const q = normalize(query.trim());
		if (!q) return tools;
		return tools.filter((t) => {
			const cat = categoryById(t.category).label;
			const haystack = normalize(`${t.title} ${t.description ?? ''} ${cat}`);
			return haystack.includes(q);
		});
	}, [tools, query]);

	// Agrupa por CATEGORIA preservando a ordem em que as categorias aparecem no
	// catálogo já ordenado (order → título), então a 1ª tool de cada categoria
	// fixa a posição do grupo.
	const groups = useMemo(() => {
		const map = new Map<string, CatalogTool[]>();
		for (const tool of filtered) {
			const list = map.get(tool.category);
			if (list) list.push(tool);
			else map.set(tool.category, [tool]);
		}
		return Array.from(map.entries()).map(([category, items]) => ({
			category,
			label: categoryById(category).label,
			items,
		}));
	}, [filtered]);

	return (
		<div className="mx-auto w-full max-w-6xl">
			<header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
						{COPY[audience].title}
					</h1>
					<p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
						{COPY[audience].subtitle}
					</p>
				</div>
				{canSeeAnalytics && (
					<div className="flex shrink-0 items-center gap-2">
						<Link
							href="/ferramentas/categorias"
							className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-violet-400 hover:text-violet-600 dark:border-white/10 dark:bg-[#1a1a1d] dark:text-gray-300 dark:hover:border-violet-500/50 dark:hover:text-white"
						>
							<FolderTree className="h-4 w-4" />
							Categorias
						</Link>
						<Link
							href="/ferramentas/analytics"
							className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-violet-400 hover:text-violet-600 dark:border-white/10 dark:bg-[#1a1a1d] dark:text-gray-300 dark:hover:border-violet-500/50 dark:hover:text-white"
						>
							<BarChart3 className="h-4 w-4" />
							Analytics de uso
						</Link>
					</div>
				)}
			</header>

			<div className="relative mb-8">
				<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 text-slate-400 dark:text-gray-500" />
				<input
					type="search"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Buscar ferramenta por nome, descrição ou categoria…"
					className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-[#1a1a1d] dark:text-white dark:placeholder:text-gray-500"
				/>
			</div>

			{isLoading ? (
				<HubState>
					<Loader2 className="h-6 w-6 animate-spin text-slate-400" />
					<p className="text-sm text-slate-500 dark:text-gray-400">
						A carregar ferramentas…
					</p>
				</HubState>
			) : tools.length === 0 ? (
				<HubState>
					<div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-gray-500">
						<Wrench className="h-6 w-6" />
					</div>
					<p className="text-sm text-slate-500 dark:text-gray-400">
						Nenhuma ferramenta disponível por aqui ainda.
					</p>
				</HubState>
			) : filtered.length === 0 ? (
				<HubState>
					<div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-gray-500">
						<Search className="h-6 w-6" />
					</div>
					<p className="text-sm text-slate-500 dark:text-gray-400">
						Nada encontrado para “{query.trim()}”.
					</p>
				</HubState>
			) : (
				<div className="space-y-10">
					{groups.map((group) => (
						<section key={group.category}>
							<div className="mb-4 flex items-center gap-3">
								<h2 className="font-display text-sm font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-gray-400">
									{group.label}
								</h2>
								<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-white/5 dark:text-gray-400">
									{group.items.length}
								</span>
								<div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent dark:from-white/10" />
							</div>
							<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
								{group.items.map((tool) => (
									<ToolCard
										key={tool.key}
										tool={tool}
										pinned={isReady && isPinned(tool.key)}
										onTogglePin={() => toggle(tool.key)}
									/>
								))}
							</div>
						</section>
					))}
				</div>
			)}
		</div>
	);
}

function HubState({ children }: { children: ReactNode }) {
	return (
		<div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 border-dashed py-20 text-center dark:border-white/10">
			{children}
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Card colorido (mesma linguagem do "Acesso Rápido") + estrela de pin     */
/* ─────────────────────────────────────────────────────────────────────── */

interface ToolCardProps {
	tool: CatalogTool;
	pinned: boolean;
	onTogglePin: () => void;
}

function ToolCard({ tool, pinned, onTogglePin }: ToolCardProps) {
	const { gradient } = TOOL_COLORS[tool.color];
	const { Icon } = tool;

	return (
		<div
			className={`group relative flex flex-col gap-2.5 overflow-hidden rounded-xl bg-gradient-to-br p-3.5 shadow-black/10 shadow-lg transition-all duration-200 ${gradient} border border-white/10 hover:-translate-y-0.5 hover:brightness-110`}
		>
			{/* Glow atmosférico no hover */}
			<div
				className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/15 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
				aria-hidden
			/>
			<div className="absolute top-0 right-0 left-0 h-[2px] rounded-t-xl bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

			{/* Estrela de pin — acima do Link (não navega ao fixar) */}
			<button
				type="button"
				onClick={onTogglePin}
				aria-pressed={pinned}
				aria-label={pinned ? `Desafixar ${tool.title}` : `Fixar ${tool.title}`}
				title={pinned ? 'Desafixar do menu' : 'Fixar no menu'}
				className="absolute top-2 right-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/25 text-white/80 backdrop-blur-sm transition hover:bg-black/40 hover:text-white"
			>
				<Star
					className={`h-3.5 w-3.5 ${pinned ? 'fill-current text-amber-300' : ''}`}
				/>
			</button>

			<Link
				href={tool.href}
				className="flex flex-col gap-2.5 focus:outline-none"
			>
				<div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
					<Icon className="h-5 w-5 text-white" />
				</div>
				<div className="relative min-w-0 pr-6">
					<p className="line-clamp-2 text-sm font-bold leading-tight text-white">
						{tool.title}
					</p>
					<p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-white/80">
						{tool.description ?? 'Ferramenta'}
					</p>
				</div>
			</Link>
		</div>
	);
}
