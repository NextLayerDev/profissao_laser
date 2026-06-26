'use client';

import {
	ArrowRight,
	BarChart3,
	BookOpen,
	CornerDownLeft,
	CreditCard,
	FileText,
	Home,
	LayoutDashboard,
	type LucideIcon,
	Package,
	Search,
	Settings,
	Users,
	Wrench,
	X,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from 'react';
import { usePermissions } from '@/modules/access';
import { useToolCatalog } from '@/modules/tools/hooks/use-tool-catalog';
import { categoryById } from '@/modules/tools/lib/tool-categories';
import { canSeeNavItem } from '@/utils/constants/permissions';
import { TOOL_COLORS } from '@/utils/constants/tool-colors';
import { useCommandPalette } from './use-command-palette';

/* ── Páginas estáticas (rotas fixas, fora do catálogo de tools) ── */

interface StaticPage {
	key: string;
	title: string;
	subtitle: string;
	href: string;
	Icon: LucideIcon;
	keywords?: string;
	/**
	 * Nome do item de navbar correspondente em `NAV_VIEW_KEYS` — só nas páginas
	 * de admin. Quando presente, a página passa pelo MESMO gate da sidebar do
	 * admin (`canSeeNavItem`). Páginas sem `viewKey` (ou sem mapeamento em
	 * `NAV_VIEW_KEYS`) ficam visíveis, idêntico ao comportamento da sidebar.
	 */
	viewKey?: string;
}

const ADMIN_PAGES: StaticPage[] = [
	{
		key: 'p-dashboard',
		title: 'Painel',
		subtitle: 'Visão geral do negócio',
		href: '/dashboard',
		Icon: LayoutDashboard,
		keywords: 'home inicio gerenciamento',
		viewKey: 'Home',
	},
	{
		key: 'p-products',
		title: 'Produtos',
		subtitle: 'Catálogo de produtos',
		href: '/products',
		Icon: Package,
		viewKey: 'Produtos',
	},
	{
		key: 'p-courses',
		title: 'Cursos',
		subtitle: 'Gerenciar cursos',
		href: '/courses',
		Icon: BookOpen,
	},
	{
		key: 'p-sales',
		title: 'Vendas',
		subtitle: 'Histórico de vendas',
		href: '/sales',
		Icon: BarChart3,
		keywords: 'faturamento',
		viewKey: 'Vendas',
	},
	{
		key: 'p-alunos',
		title: 'Alunos',
		subtitle: 'Base de alunos',
		href: '/alunos',
		Icon: Users,
		keywords: 'membros clientes',
		viewKey: 'Alunos',
	},
	{
		key: 'p-fatura',
		title: 'Fatura',
		subtitle: 'Custos e faturamento',
		href: '/fatura',
		Icon: CreditCard,
		keywords: 'financeiro custo',
		viewKey: 'Financeiro',
	},
	{
		key: 'p-acessos',
		title: 'Acessos',
		subtitle: 'Permissões e papéis',
		href: '/acessos',
		Icon: Settings,
		keywords: 'rbac permissao',
		viewKey: 'Acessos',
	},
	{
		key: 'p-ferramentas',
		title: 'Fábrica de Ferramentas',
		subtitle: 'Criar e gerir ferramentas',
		href: '/ferramentas',
		Icon: Wrench,
		keywords: 'tools builder',
		viewKey: 'Ferramentas',
	},
];

const STUDENT_PAGES: StaticPage[] = [
	{
		key: 'p-home',
		title: 'Início',
		subtitle: 'Sua central',
		href: '/course',
		Icon: Home,
		keywords: 'home dashboard',
	},
	{
		key: 'p-jornada',
		title: 'Aulas',
		subtitle: 'Conteúdo do curso',
		href: '/course/jornada',
		Icon: BookOpen,
		keywords: 'cursos aulas gravadas jornada',
	},
	{
		key: 'p-forum',
		title: 'Fórum',
		subtitle: 'Discuta com a comunidade',
		href: '/course/forum',
		Icon: Users,
		keywords: 'comunidade discussao',
	},
	{
		key: 'p-voxes',
		title: 'Voxxys',
		subtitle: 'Saldo e pacotes',
		href: '/course/voxes',
		Icon: CreditCard,
		keywords: 'creditos saldo',
	},
	{
		key: 'p-parametros',
		title: 'Parâmetros',
		subtitle: 'Configurações de gravação',
		href: '/course/parametros',
		Icon: FileText,
		keywords: 'configs maquina material',
	},
	{
		key: 'p-perfil',
		title: 'Perfil',
		subtitle: 'Seus dados',
		href: '/course/perfil',
		Icon: Settings,
		keywords: 'conta dados',
	},
];

/* ── Item normalizado (tools + páginas) ── */

interface PaletteItem {
	key: string;
	title: string;
	subtitle: string;
	href: string;
	Icon: LucideIcon;
	/** Chip de grupo (categoria da tool ou "Página"). */
	groupLabel: string;
	/** Gradiente do ícone (tools herdam da paleta; páginas usam neutro). */
	iconBg: string;
	/** String concatenada pra busca fuzzy. */
	haystack: string;
}

const PAGE_ICON_BG = 'bg-slate-500/15 text-slate-600 dark:text-slate-300';

/**
 * Match fuzzy por subsequência: todos os caracteres da query aparecem na ordem.
 * Pontua mais alto para prefixo e para caracteres contíguos — sem dependência
 * externa, leve o suficiente para o catálogo + páginas.
 */
function fuzzyScore(query: string, target: string): number {
	if (!query) return 1;
	const q = query.toLowerCase();
	const t = target.toLowerCase();
	if (t.includes(q)) {
		// Substring direto: bônus por começar no início.
		return 1000 - t.indexOf(q);
	}
	let qi = 0;
	let score = 0;
	let streak = 0;
	for (let ti = 0; ti < t.length && qi < q.length; ti++) {
		if (t[ti] === q[qi]) {
			streak += 1;
			score += streak;
			qi += 1;
		} else {
			streak = 0;
		}
	}
	return qi === q.length ? score : -1;
}

export function CommandPalette() {
	const { audience, isOpen, close } = useCommandPalette();
	const router = useRouter();
	const pathname = usePathname();
	const { tools } = useToolCatalog(audience);
	const { can } = usePermissions();

	const [query, setQuery] = useState('');
	const [active, setActive] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const listId = useId();

	// Fecha (e zera) ao trocar de rota — o palette nunca persiste entre páginas.
	// biome-ignore lint/correctness/useExhaustiveDependencies: reset on route change
	useEffect(() => {
		close();
	}, [pathname]);

	// Foco no input + reset ao abrir.
	useEffect(() => {
		if (isOpen) {
			setQuery('');
			setActive(0);
			// note: rAF garante que o input já está montado antes do focus.
			const id = requestAnimationFrame(() => inputRef.current?.focus());
			return () => cancelAnimationFrame(id);
		}
	}, [isOpen]);

	// Páginas de admin passam pelo MESMO gate da sidebar do admin: sem isso, staff
	// não-super-admin veria páginas que não pode abrir (vazamento de gating). As
	// páginas do aluno são compartilhadas — ficam como estão.
	const pages = useMemo<StaticPage[]>(() => {
		if (audience !== 'admin') return STUDENT_PAGES;
		return ADMIN_PAGES.filter((p) =>
			p.viewKey ? canSeeNavItem(p.viewKey, can) : true,
		);
	}, [audience, can]);

	const allItems = useMemo<PaletteItem[]>(() => {
		const toolItems = tools.map((t): PaletteItem => {
			const palette = TOOL_COLORS[t.color];
			const groupLabel = categoryById(t.category).label;
			return {
				key: `tool-${t.key}`,
				title: t.title,
				subtitle: t.description ?? 'Ferramenta',
				href: t.href,
				Icon: t.Icon,
				groupLabel,
				iconBg: palette.iconBg,
				haystack: `${t.title} ${t.description ?? ''} ${groupLabel} ${t.key}`,
			};
		});
		const pageItems = pages.map(
			(p): PaletteItem => ({
				key: p.key,
				title: p.title,
				subtitle: p.subtitle,
				href: p.href,
				Icon: p.Icon,
				groupLabel: 'Página',
				iconBg: PAGE_ICON_BG,
				haystack: `${p.title} ${p.subtitle} ${p.keywords ?? ''} página pagina`,
			}),
		);
		return [...toolItems, ...pageItems];
	}, [tools, pages]);

	const results = useMemo<PaletteItem[]>(() => {
		const q = query.trim();
		if (!q) return allItems;
		return allItems
			.map((item) => ({ item, score: fuzzyScore(q, item.haystack) }))
			.filter((r) => r.score >= 0)
			.sort((a, b) => b.score - a.score)
			.map((r) => r.item);
	}, [allItems, query]);

	// Volta o cursor pro topo a cada nova busca (resultados mudam de ordem).
	// biome-ignore lint/correctness/useExhaustiveDependencies: reset cursor when query changes
	useEffect(() => {
		setActive(0);
	}, [query]);

	const go = useCallback(
		(href: string) => {
			close();
			router.push(href);
		},
		[close, router],
	);

	const onKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				close();
				return;
			}
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				setActive((i) => (results.length ? (i + 1) % results.length : 0));
				return;
			}
			if (e.key === 'ArrowUp') {
				e.preventDefault();
				setActive((i) =>
					results.length ? (i - 1 + results.length) % results.length : 0,
				);
				return;
			}
			if (e.key === 'Enter') {
				e.preventDefault();
				const sel = results[active];
				if (sel) go(sel.href);
			}
		},
		[results, active, close, go],
	);

	// Mantém o item ativo visível ao navegar com setas.
	useEffect(() => {
		const node = listRef.current?.querySelector<HTMLElement>(
			`[data-index="${active}"]`,
		);
		node?.scrollIntoView({ block: 'nearest' });
	}, [active]);

	if (!isOpen) return null;

	return (
		// biome-ignore lint/a11y/useSemanticElements: backdrop overlay wraps modal content
		<div
			className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 sm:pt-[12vh] animate-[fade-in-up_0.15s_ease-out_both]"
			onClick={close}
			onKeyDown={(e) => e.key === 'Escape' && close()}
			role="button"
			tabIndex={-1}
			aria-label="Fechar busca"
		>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: stop-propagation panel, keys handled on input */}
			<div
				className="relative flex w-full sm:max-w-xl h-full sm:h-auto sm:max-h-[70vh] flex-col overflow-hidden bg-white dark:bg-[#1a1a1d] sm:rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl"
				onClick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-label="Buscar ferramentas e páginas"
			>
				{/* Input */}
				<div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/10 px-4">
					<Search className="w-5 h-5 shrink-0 text-slate-400" />
					<input
						ref={inputRef}
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={onKeyDown}
						placeholder="Buscar ferramentas, páginas..."
						aria-label="Buscar"
						aria-controls={listId}
						className="flex-1 bg-transparent py-4 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none"
					/>
					<button
						type="button"
						onClick={close}
						aria-label="Fechar"
						className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				{/* Resultados */}
				<div
					ref={listRef}
					id={listId}
					className="flex-1 overflow-y-auto overscroll-contain py-2 px-2"
				>
					{results.length === 0 ? (
						<div className="px-4 py-12 text-center">
							<p className="text-sm text-slate-500 dark:text-gray-400">
								Nenhum resultado para{' '}
								<span className="font-semibold text-slate-700 dark:text-slate-200">
									“{query}”
								</span>
							</p>
						</div>
					) : (
						results.map((item, i) => {
							const isActive = i === active;
							const Icon = item.Icon;
							return (
								<button
									type="button"
									key={item.key}
									data-index={i}
									onClick={() => go(item.href)}
									onMouseMove={() => setActive(i)}
									className={`group flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
										isActive
											? 'bg-violet-50 dark:bg-violet-500/10'
											: 'hover:bg-slate-50 dark:hover:bg-white/5'
									}`}
								>
									<span
										className={`flex w-9 h-9 shrink-0 items-center justify-center rounded-lg ${item.iconBg}`}
									>
										<Icon className="w-[18px] h-[18px]" />
									</span>
									<span className="flex-1 min-w-0">
										<span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
											{item.title}
										</span>
										<span className="block truncate text-xs text-slate-500 dark:text-gray-400">
											{item.subtitle}
										</span>
									</span>
									<span className="block max-w-[5.5rem] shrink-0 truncate text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 sm:max-w-none">
										{item.groupLabel}
									</span>
									{isActive ? (
										<CornerDownLeft className="w-4 h-4 shrink-0 text-violet-500" />
									) : (
										<ArrowRight className="w-4 h-4 shrink-0 text-transparent group-hover:text-slate-300 dark:group-hover:text-gray-600" />
									)}
								</button>
							);
						})
					)}
				</div>

				{/* Rodapé com dicas de teclado */}
				<div className="hidden sm:flex items-center justify-between gap-3 border-t border-slate-200 dark:border-white/10 px-4 py-2.5 text-[11px] text-slate-400 dark:text-gray-500">
					<span className="flex items-center gap-3">
						<Kbd>↑</Kbd>
						<Kbd>↓</Kbd>
						<span>navegar</span>
					</span>
					<span className="flex items-center gap-1.5">
						<Kbd>Enter</Kbd>
						<span>abrir</span>
						<span className="mx-1">·</span>
						<Kbd>Esc</Kbd>
						<span>fechar</span>
					</span>
				</div>
			</div>
		</div>
	);
}

function Kbd({ children }: { children: React.ReactNode }) {
	return (
		<kbd className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 font-sans text-[10px] font-semibold text-slate-500 dark:text-gray-400">
			{children}
		</kbd>
	);
}
