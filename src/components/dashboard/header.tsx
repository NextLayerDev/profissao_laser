'use client';

import {
	BarChart3,
	BookOpen,
	ChevronDown,
	FolderOpen,
	LayoutGrid,
	type LucideIcon,
	Menu,
	Search,
	Settings2,
	Users,
	Wrench,
	X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SupportNotificationsBell } from '@/components/dashboard/support-notifications-bell';
import { UserBadge } from '@/components/store/user-badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { useCommandPalette } from '@/components/tools/use-command-palette';
import { useAdminPendings } from '@/hooks/use-admin-pendings';
import { usePermissions } from '@/modules/access';
import {
	type CatalogTool,
	useToolCatalog,
} from '@/modules/tools/hooks/use-tool-catalog';
import { ADMIN_SECTIONS } from '@/modules/tools/lib/tool-categories';
import type { NavItem } from '@/types/navigation';
import { navItems } from '@/utils/constants/navigation';
import { canSeeNavItem } from '@/utils/constants/permissions';

/** Rótulos humanos (PT-BR) das seções da topologia do admin. */
const SECTION_LABELS: Record<string, string> = {
	PRINCIPAL: 'Principal',
	CONTEUDO: 'Conteúdo',
	OPERACAO: 'Operação',
	FERRAMENTAS: 'Ferramentas',
	SISTEMA: 'Sistema',
};

/** Ícone do gatilho de cada seção na top bar (apenas visual). */
const SECTION_ICONS: Record<string, LucideIcon> = {
	PRINCIPAL: LayoutGrid,
	CONTEUDO: BookOpen,
	OPERACAO: Settings2,
	FERRAMENTAS: Wrench,
	SISTEMA: FolderOpen,
};

/** Seção default p/ itens sem `section` declarada (não some do menu). */
const DEFAULT_SECTION = 'PRINCIPAL';

/** Item da top bar (alias de `NavItem`) — as seções fixas vêm de `navItems`. */
type RenderItem = NavItem;

interface RenderSection {
	id: string;
	label: string;
	Icon: LucideIcon;
	items: RenderItem[];
}

/** Highlight ativo / hover / repouso (paleta da marca). */
const ACTIVE_CLASSES =
	'bg-gradient-to-r from-violet-100 to-purple-50 text-violet-700 dark:from-violet-950/60 dark:to-purple-900/30 dark:text-violet-300';
const HOVER_CLASSES =
	'hover:bg-violet-50/60 dark:hover:bg-violet-950/30 hover:text-violet-700 dark:hover:text-violet-300';
const IDLE_CLASSES = 'text-slate-600 dark:text-gray-300';

/** Gatilho da nav: ícone sempre; label só em lg+ (colapsa sem estourar). */
const NAV_TRIGGER =
	'h-9 flex items-center gap-1.5 px-2.5 rounded-lg text-sm font-medium transition-all duration-200 shrink-0';

function Separator() {
	return <div className="w-px h-5 bg-slate-200 dark:bg-white/10 shrink-0" />;
}

/** Badge numérico vermelho (pendências). */
function CountBadge({ count }: { count: number }) {
	if (count <= 0) return null;
	return (
		<span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white leading-none shrink-0">
			{count > 99 ? '99+' : count}
			<span className="sr-only"> pendências</span>
		</span>
	);
}

/** Seção com 1 item só → link direto na barra (não vira dropdown bobo). */
function NavLinkTrigger({
	item,
	active,
	badge,
}: {
	item: RenderItem;
	active: boolean;
	badge: number;
}) {
	const Icon = item.icon;
	return (
		<Link
			href={item.href}
			title={item.name}
			className={`${NAV_TRIGGER} ${active ? ACTIVE_CLASSES : `${IDLE_CLASSES} ${HOVER_CLASSES}`}`}
		>
			<Icon className="w-4 h-4 shrink-0" />
			<span className="hidden xl:inline">{item.name}</span>
			<CountBadge count={badge} />
		</Link>
	);
}

/**
 * Dropdown de uma seção: gatilho (ícone + label + chevron) + painel absoluto.
 * Fecha no clique fora (mousedown global), no Escape e ao clicar num item.
 * Tailwind puro — sem radix. O painel NÃO é clipado (a nav não usa overflow).
 */
function SectionDropdown({
	section,
	isActive,
	badgeByHref,
}: {
	section: RenderSection;
	isActive: (href: string) => boolean;
	badgeByHref: Record<string, number>;
}) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const onDown = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false);
		};
		document.addEventListener('mousedown', onDown);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onDown);
			document.removeEventListener('keydown', onKey);
		};
	}, [open]);

	const sectionBadge = section.items.reduce(
		(acc, item) => acc + (badgeByHref[item.href] ?? 0),
		0,
	);
	const hasActive = section.items.some((item) => isActive(item.href));
	const SectionIcon = section.Icon;

	return (
		<div ref={ref} className="relative shrink-0">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				aria-haspopup="menu"
				aria-label={section.label}
				title={section.label}
				className={`${NAV_TRIGGER} ${
					hasActive
						? 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'
						: `${IDLE_CLASSES} ${HOVER_CLASSES}`
				}`}
			>
				<SectionIcon className="w-4 h-4 shrink-0" />
				<span className="hidden xl:inline">{section.label}</span>
				<CountBadge count={sectionBadge} />
				<ChevronDown
					className={`w-3.5 h-3.5 shrink-0 opacity-60 transition-transform duration-200 ${
						open ? 'rotate-180' : ''
					}`}
				/>
			</button>

			{open && (
				<div
					role="menu"
					className="absolute left-0 top-full mt-1.5 w-60 max-w-[calc(100vw-1rem)] max-h-[70vh] overflow-y-auto z-50 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0b0f] shadow-lg dark:shadow-black/40 p-1.5"
				>
					{section.items.map((item) => {
						const active = isActive(item.href);
						const badge = badgeByHref[item.href] ?? 0;
						const ItemIcon = item.icon;
						return (
							<Link
								key={item.name}
								href={item.href}
								role="menuitem"
								onClick={() => setOpen(false)}
								className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
									active ? ACTIVE_CLASSES : `${IDLE_CLASSES} ${HOVER_CLASSES}`
								}`}
							>
								<ItemIcon className="w-4 h-4 shrink-0" />
								<span className="flex-1 truncate">{item.name}</span>
								<CountBadge count={badge} />
							</Link>
						);
					})}
				</div>
			)}
		</div>
	);
}

/**
 * Dropdown da seção FERRAMENTAS — NÃO vem de `navItems`, e sim do catálogo
 * completo de tools do admin (`useToolCatalog('admin').tools`, já ordenado por
 * `order`). Cada tool vira um item linkando pra `tool.href` com o `tool.Icon`.
 * Rodapé opcional "Ver todas as ferramentas" → /ferramentas/hub, exibido só com
 * permissão `tools.build`. Some por inteiro quando não há tools nem rodapé.
 */
function FerramentasDropdown({
	tools,
	canBuild,
	isActive,
}: {
	tools: CatalogTool[];
	canBuild: boolean;
	isActive: (href: string) => boolean;
}) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const onDown = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false);
		};
		document.addEventListener('mousedown', onDown);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onDown);
			document.removeEventListener('keydown', onKey);
		};
	}, [open]);

	const hasActive =
		tools.some((t) => isActive(t.href)) ||
		(canBuild && isActive('/ferramentas/hub'));

	return (
		<div ref={ref} className="relative shrink-0">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				aria-haspopup="menu"
				aria-label={SECTION_LABELS.FERRAMENTAS}
				title={SECTION_LABELS.FERRAMENTAS}
				className={`${NAV_TRIGGER} ${
					hasActive
						? 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'
						: `${IDLE_CLASSES} ${HOVER_CLASSES}`
				}`}
			>
				<Wrench className="w-4 h-4 shrink-0" />
				<span className="hidden xl:inline">{SECTION_LABELS.FERRAMENTAS}</span>
				<ChevronDown
					className={`w-3.5 h-3.5 shrink-0 opacity-60 transition-transform duration-200 ${
						open ? 'rotate-180' : ''
					}`}
				/>
			</button>

			{open && (
				<div
					role="menu"
					className="absolute left-0 top-full mt-1.5 w-60 max-w-[calc(100vw-1rem)] max-h-[70vh] overflow-y-auto z-50 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0b0f] shadow-lg dark:shadow-black/40 p-1.5"
				>
					{tools.map((tool) => {
						const active = isActive(tool.href);
						const ToolIcon = tool.Icon;
						return (
							<Link
								key={tool.key}
								href={tool.href}
								role="menuitem"
								onClick={() => setOpen(false)}
								className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
									active ? ACTIVE_CLASSES : `${IDLE_CLASSES} ${HOVER_CLASSES}`
								}`}
							>
								<ToolIcon className="w-4 h-4 shrink-0" />
								<span className="flex-1 truncate">{tool.title}</span>
							</Link>
						);
					})}
					{canBuild && (
						<>
							<Link
								href="/ferramentas/hub"
								role="menuitem"
								onClick={() => setOpen(false)}
								className={`mt-1 flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
									tools.length > 0
										? 'border-t border-slate-200 dark:border-white/10 pt-2.5'
										: ''
								} ${
									isActive('/ferramentas/hub')
										? ACTIVE_CLASSES
										: `${IDLE_CLASSES} ${HOVER_CLASSES}`
								}`}
							>
								<Wrench className="w-4 h-4 shrink-0" />
								<span className="flex-1 truncate">
									Ver todas as ferramentas
								</span>
							</Link>
							<Link
								href="/ferramentas/analytics"
								role="menuitem"
								onClick={() => setOpen(false)}
								className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
									isActive('/ferramentas/analytics')
										? ACTIVE_CLASSES
										: `${IDLE_CLASSES} ${HOVER_CLASSES}`
								}`}
							>
								<BarChart3 className="w-4 h-4 shrink-0" />
								<span className="flex-1 truncate">
									Analytics de ferramentas
								</span>
							</Link>
						</>
					)}
				</div>
			)}
		</div>
	);
}

export function Header() {
	const { open: openPalette } = useCommandPalette();
	const pathname = usePathname();
	const { can } = usePermissions();

	// Seção FERRAMENTAS = catálogo COMPLETO de tools do admin (já gateado por
	// público e ordenado por `order`). Substitui a injeção das tools pinadas.
	const { tools: catalogTools } = useToolCatalog('admin');
	// Rodapé "Ver todas as ferramentas" → /ferramentas/hub só com permissão.
	const canBuildTools = can('tools.build');

	const canSeeSuporte = canSeeNavItem('Suporte', can);
	const { supportTotal, forumUnanswered } = useAdminPendings(canSeeSuporte);

	/** Pendências por rota — badges nos itens. */
	const badgeByHref = useMemo<Record<string, number>>(
		() => ({
			'/suporte': supportTotal,
			'/forum': forumUnanswered,
		}),
		[supportTotal, forumUnanswered],
	);

	const isActive = useCallback(
		(href: string) =>
			pathname === href ||
			(href !== '/dashboard' && pathname.startsWith(`${href}/`)),
		[pathname],
	);

	// Agrupa SÓ os itens fixos (gateados) por seção, na ordem canônica. A seção
	// FERRAMENTAS é EXCLUÍDA aqui — ela é renderizada à parte a partir do catálogo
	// completo de tools (ver `FerramentasDropdown`), e não mais de `navItems`.
	const sections = useMemo<RenderSection[]>(() => {
		const bySection = new Map<string, RenderItem[]>();
		for (const id of ADMIN_SECTIONS) bySection.set(id, []);

		const push = (id: string, item: RenderItem) => {
			const key = bySection.has(id) ? id : DEFAULT_SECTION;
			bySection.get(key)?.push(item);
		};

		for (const item of navItems) {
			if (item.section === 'FERRAMENTAS') continue;
			if (!canSeeNavItem(item.name, can)) continue;
			push(item.section ?? DEFAULT_SECTION, item);
		}

		return ADMIN_SECTIONS.filter((id) => id !== 'FERRAMENTAS')
			.map((id) => ({
				id,
				label: SECTION_LABELS[id] ?? id,
				Icon: SECTION_ICONS[id] ?? LayoutGrid,
				items: bySection.get(id) ?? [],
			}))
			.filter((s) => s.items.length > 0);
	}, [can]);

	/** FERRAMENTAS deve renderizar se há tools no catálogo OU rodapé do hub. */
	const showFerramentas = catalogTools.length > 0 || canBuildTools;

	const [mobileOpen, setMobileOpen] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: fecha o drawer ao navegar
	useEffect(() => {
		setMobileOpen(false);
	}, [pathname]);

	return (
		<header className="h-[64px] px-3 md:px-6 flex items-center gap-2 md:gap-3 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#040405]/90 backdrop-blur-sm sticky top-0 z-30">
			{/* LEFT: hambúrguer (mobile) + marca compacta */}
			<div className="flex items-center gap-2 shrink-0">
				<button
					type="button"
					onClick={() => setMobileOpen(true)}
					aria-label="Abrir menu"
					className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
				>
					<Menu className="w-5 h-5" />
				</button>
				<Link
					href="/dashboard"
					className="flex items-center gap-2 shrink-0"
					aria-label="Gerenciamento"
				>
					<div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 shadow-sm dark:shadow-md dark:shadow-purple-950/60">
						<Image
							src="/favicon.png"
							alt="Profissão Laser"
							width={28}
							height={28}
							className="w-full h-full object-cover"
						/>
					</div>
					<span className="hidden sm:inline text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-none">
						Gerenciamento
					</span>
				</Link>
			</div>

			{/* Divisória marca ↔ nav (desktop) */}
			<div className="hidden lg:block">
				<Separator />
			</div>

			{/*
			  MIDDLE: nav (desktop). Alinhada à ESQUERDA (sem justify-center, que
			  causava sobreposição) e sem overflow-hidden (clipava o painel). Cada
			  seção vira dropdown; seção de 1 item vira link direto. min-w-0 deixa a
			  faixa encolher sem empurrar a marca/cluster.
			*/}
			<nav className="hidden lg:flex items-center gap-1 min-w-0">
				{sections.map((section) => (
					<span key={section.id} className="contents">
						{/* FERRAMENTAS (catálogo) entra na posição canônica: antes de SISTEMA. */}
						{section.id === 'SISTEMA' && showFerramentas && (
							<FerramentasDropdown
								tools={catalogTools}
								canBuild={canBuildTools}
								isActive={isActive}
							/>
						)}
						{section.items.length === 1 ? (
							<NavLinkTrigger
								item={section.items[0]}
								active={isActive(section.items[0].href)}
								badge={badgeByHref[section.items[0].href] ?? 0}
							/>
						) : (
							<SectionDropdown
								section={section}
								isActive={isActive}
								badgeByHref={badgeByHref}
							/>
						)}
					</span>
				))}
				{/* Sem SISTEMA visível, FERRAMENTAS ainda precisa aparecer ao final. */}
				{showFerramentas && !sections.some((s) => s.id === 'SISTEMA') && (
					<FerramentasDropdown
						tools={catalogTools}
						canBuild={canBuildTools}
						isActive={isActive}
					/>
				)}
			</nav>

			{/* RIGHT: cluster enxuto, empurrado pra direita (ml-auto). */}
			<div className="flex items-center gap-2 shrink-0 ml-auto">
				<button
					type="button"
					onClick={openPalette}
					aria-label="Buscar ferramentas e páginas"
					title="Buscar (⌘K)"
					className="h-9 flex items-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-violet-500/50 hover:bg-slate-100/80 dark:hover:bg-white/[0.07] px-3 rounded-lg text-sm text-slate-500 dark:text-gray-400 transition-all duration-200"
				>
					<Search className="w-4 h-4" />
					<span className="hidden 2xl:inline">Buscar</span>
					<kbd className="hidden 2xl:inline-flex items-center px-1.5 h-5 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-[10px] font-semibold text-slate-400 dark:text-gray-500">
						⌘K
					</kbd>
				</button>
				<Separator />
				<SupportNotificationsBell />
				<ThemeToggle />
				<Separator />
				<UserBadge />
			</div>

			{/* MOBILE DRAWER */}
			{mobileOpen && (
				<div className="fixed inset-0 z-50 md:hidden">
					{/* biome-ignore lint/a11y/useSemanticElements: backdrop overlay wraps modal content */}
					<div
						className="absolute inset-0 bg-black/50"
						onClick={() => setMobileOpen(false)}
						onKeyDown={(e) => e.key === 'Escape' && setMobileOpen(false)}
						role="button"
						tabIndex={0}
						aria-label="Fechar menu"
					/>
					<div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white dark:bg-[#06070a] border-r border-slate-200 dark:border-white/10 flex flex-col">
						{/* Header do drawer */}
						<div className="h-16 flex items-center justify-between px-4 shrink-0 border-b border-slate-200 dark:border-white/5">
							<div className="flex items-center gap-2">
								<div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
									<Image
										src="/favicon.png"
										alt="Profissão Laser"
										width={32}
										height={32}
										className="w-full h-full object-cover"
									/>
								</div>
								<span className="text-sm font-semibold text-slate-900 dark:text-white">
									Gerenciamento
								</span>
							</div>
							<button
								type="button"
								onClick={() => setMobileOpen(false)}
								aria-label="Fechar menu"
								className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Ação compacta: ⌘K */}
						<div className="px-3 py-3 border-b border-slate-200 dark:border-white/5">
							<button
								type="button"
								onClick={() => {
									setMobileOpen(false);
									openPalette();
								}}
								className="w-full h-9 flex items-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 rounded-lg text-sm text-slate-500 dark:text-gray-400"
							>
								<Search className="w-4 h-4" />
								<span>Buscar</span>
							</button>
						</div>

						{/* Nav completa */}
						<div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
							{/* Seções (FERRAMENTAS é renderizada à parte, do catálogo) */}
							{sections.map((section) => {
								const SectionIcon = section.Icon;
								return (
									<div key={section.id}>
										<p className="flex items-center gap-1.5 px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-600">
											<SectionIcon className="w-3 h-3" />
											{section.label}
										</p>
										<div className="space-y-0.5">
											{section.items.map((item) => {
												const active = isActive(item.href);
												const badge = badgeByHref[item.href] ?? 0;
												const ItemIcon = item.icon;
												return (
													<Link
														key={item.name}
														href={item.href}
														onClick={() => setMobileOpen(false)}
														className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
															active
																? ACTIVE_CLASSES
																: `${IDLE_CLASSES} ${HOVER_CLASSES}`
														}`}
													>
														<ItemIcon className="w-4 h-4 shrink-0" />
														<span className="flex-1 truncate">{item.name}</span>
														<CountBadge count={badge} />
													</Link>
												);
											})}
										</div>
									</div>
								);
							})}

							{/* FERRAMENTAS — catálogo completo + rodapé do hub (gateado). */}
							{showFerramentas && (
								<div>
									<p className="flex items-center gap-1.5 px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-600">
										<Wrench className="w-3 h-3" />
										{SECTION_LABELS.FERRAMENTAS}
									</p>
									<div className="space-y-0.5">
										{catalogTools.map((tool) => {
											const active = isActive(tool.href);
											const ToolIcon = tool.Icon;
											return (
												<Link
													key={tool.key}
													href={tool.href}
													onClick={() => setMobileOpen(false)}
													className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
														active
															? ACTIVE_CLASSES
															: `${IDLE_CLASSES} ${HOVER_CLASSES}`
													}`}
												>
													<ToolIcon className="w-4 h-4 shrink-0" />
													<span className="flex-1 truncate">{tool.title}</span>
												</Link>
											);
										})}
										{canBuildTools && (
											<>
												<Link
													href="/ferramentas/hub"
													onClick={() => setMobileOpen(false)}
													className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
														isActive('/ferramentas/hub')
															? ACTIVE_CLASSES
															: `${IDLE_CLASSES} ${HOVER_CLASSES}`
													}`}
												>
													<Wrench className="w-4 h-4 shrink-0" />
													<span className="truncate">
														Ver todas as ferramentas
													</span>
												</Link>
												<Link
													href="/ferramentas/analytics"
													onClick={() => setMobileOpen(false)}
													className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
														isActive('/ferramentas/analytics')
															? ACTIVE_CLASSES
															: `${IDLE_CLASSES} ${HOVER_CLASSES}`
													}`}
												>
													<BarChart3 className="w-4 h-4 shrink-0" />
													<span className="truncate">
														Analytics de ferramentas
													</span>
												</Link>
											</>
										)}
									</div>
								</div>
							)}
						</div>

						{/* Footer: UserBadge */}
						<div className="px-3 py-3 border-t border-slate-200 dark:border-white/5 flex items-center gap-2">
							<Users className="w-4 h-4 text-slate-400 dark:text-gray-500 shrink-0" />
							<UserBadge />
						</div>
					</div>
				</div>
			)}
		</header>
	);
}
