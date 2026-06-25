'use client';

import {
	BookOpen,
	ChevronDown,
	FolderOpen,
	LayoutGrid,
	type LucideIcon,
	Menu,
	Search,
	Settings2,
	Store,
	Users,
	Wrench,
	X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChatButton } from '@/components/dashboard/chat-button';
import { SupportNotificationsBell } from '@/components/dashboard/support-notifications-bell';
import { UserBadge } from '@/components/store/user-badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { useCommandPalette } from '@/components/tools/use-command-palette';
import { useAdminPendings } from '@/hooks/use-admin-pendings';
import { usePermissions } from '@/modules/access';
import { useAdminToolNav } from '@/modules/tools/hooks/use-admin-tool-nav';
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

/** Ícone do botão de cada seção na top bar (apenas visual). */
const SECTION_ICONS: Record<string, LucideIcon> = {
	PRINCIPAL: LayoutGrid,
	CONTEUDO: BookOpen,
	OPERACAO: Settings2,
	FERRAMENTAS: Wrench,
	SISTEMA: FolderOpen,
};

/** Seção default p/ itens sem `section` declarada (não some do menu). */
const DEFAULT_SECTION = 'PRINCIPAL';

/** Item da top bar enriquecido p/ render — pode ser uma tool pinada (toolKey). */
interface RenderItem extends NavItem {
	/** Presente só nas ferramentas pinadas — herda o "desafixar" (não usado aqui). */
	toolKey?: string;
}

interface RenderSection {
	id: string;
	label: string;
	Icon: LucideIcon;
	items: RenderItem[];
}

/** Estilo de highlight ativo (espelha system_porteira). */
const ACTIVE_CLASSES =
	'bg-gradient-to-r from-violet-100 to-purple-50 text-violet-700 dark:from-violet-950/60 dark:to-purple-900/30 dark:text-violet-300';
const HOVER_CLASSES =
	'hover:bg-violet-50/60 dark:hover:bg-violet-950/30 hover:text-violet-700 dark:hover:text-violet-300';

function Separator({ responsive }: { responsive?: boolean }) {
	return (
		<div
			className={`w-px h-5 bg-slate-200 dark:bg-white/10 shrink-0 ${
				responsive ? 'hidden lg:block' : ''
			}`}
		/>
	);
}

/** Badge numérico vermelho (pendências). */
function CountBadge({ count }: { count: number }) {
	if (count <= 0) return null;
	return (
		<span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white leading-none shrink-0">
			{count > 99 ? '99+' : count}
		</span>
	);
}

/**
 * Dropdown de uma seção: botão (ícone + label + chevron) + painel absoluto.
 * Fecha no clique fora (mousedown global) e ao navegar (mudança de pathname,
 * tratada pelo pai via `key`/`open` reset). Tailwind puro — sem radix.
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
				className={`h-9 flex items-center gap-1.5 px-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
					hasActive
						? 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'
						: `text-slate-600 dark:text-gray-300 ${HOVER_CLASSES}`
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
					className="absolute left-0 top-full mt-1.5 w-60 z-50 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0b0f] shadow-lg dark:shadow-black/40 p-1.5"
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
									active
										? ACTIVE_CLASSES
										: `text-slate-600 dark:text-gray-300 ${HOVER_CLASSES}`
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

export function Header() {
	const { open: openPalette } = useCommandPalette();
	const pathname = usePathname();
	const { can, isSuperAdmin } = usePermissions();

	// Tools da Fábrica PINADAS (já gateadas no catálogo).
	const toolNav = useAdminToolNav(isSuperAdmin);

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

	// Agrupa itens fixos (gateados) + tools pinadas por seção, na ordem canônica.
	const sections = useMemo<RenderSection[]>(() => {
		const bySection = new Map<string, RenderItem[]>();
		for (const id of ADMIN_SECTIONS) bySection.set(id, []);

		const push = (id: string, item: RenderItem) => {
			const key = bySection.has(id) ? id : DEFAULT_SECTION;
			bySection.get(key)?.push(item);
		};

		for (const item of navItems) {
			if (!canSeeNavItem(item.name, can)) continue;
			push(item.section ?? DEFAULT_SECTION, item);
		}
		// Tools pinadas entram na própria seção (quase sempre FERRAMENTAS).
		for (const tool of toolNav) {
			push(tool.section, {
				name: tool.name,
				icon: tool.icon,
				href: tool.href,
				hasDropdown: false,
				section: tool.section,
				toolKey: tool.toolKey,
			});
		}

		return ADMIN_SECTIONS.map((id) => ({
			id,
			label: SECTION_LABELS[id] ?? id,
			Icon: SECTION_ICONS[id] ?? LayoutGrid,
			items: bySection.get(id) ?? [],
		})).filter((s) => s.items.length > 0);
	}, [can, toolNav]);

	const [mobileOpen, setMobileOpen] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: fecha o drawer ao navegar
	useEffect(() => {
		setMobileOpen(false);
	}, [pathname]);

	return (
		<header className="h-[64px] px-3 md:px-6 flex items-center gap-2 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#040405]/90 backdrop-blur-sm sticky top-0 z-30">
			{/* LEFT: hamburger (mobile) + brand compacto */}
			<div className="flex items-center gap-2 shrink-0">
				<button
					type="button"
					onClick={() => setMobileOpen(true)}
					aria-label="Abrir menu"
					className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
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

			{/* MIDDLE: nav (desktop) — pins inline + dropdowns por seção */}
			<nav className="hidden md:flex flex-1 items-center justify-center gap-1 min-w-0 overflow-hidden">
				{/* Pins (compactos) */}
				{toolNav.length > 0 && (
					<>
						<div className="flex flex-nowrap shrink-0 items-center gap-0.5">
							{toolNav.map((tool) => {
								const active = isActive(tool.href);
								const ToolIcon = tool.icon;
								return (
									<Link
										key={tool.toolKey}
										href={tool.href}
										title={tool.name}
										className={`h-9 flex items-center gap-1.5 px-2 rounded-lg text-xs font-medium transition-all duration-200 ${
											active
												? ACTIVE_CLASSES
												: `text-slate-600 dark:text-gray-300 ${HOVER_CLASSES}`
										}`}
									>
										<ToolIcon className="w-4 h-4 shrink-0" />
										<span className="hidden 2xl:inline truncate max-w-[8rem]">
											{tool.name}
										</span>
									</Link>
								);
							})}
						</div>
						<Separator />
					</>
				)}
				{/* Dropdowns por seção */}
				<div className="flex flex-nowrap items-center justify-center gap-0.5 min-w-0">
					{sections.map((section) => (
						<SectionDropdown
							key={section.id}
							section={section}
							isActive={isActive}
							badgeByHref={badgeByHref}
						/>
					))}
				</div>
			</nav>

			{/* Spacer p/ empurrar o cluster direito quando a nav está oculta (mobile) */}
			<div className="flex-1 md:hidden" />

			{/* RIGHT: cluster original (inalterado) */}
			<div className="flex items-center gap-2 shrink-0">
				<button
					type="button"
					onClick={openPalette}
					aria-label="Buscar ferramentas e páginas"
					className="h-9 flex items-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-violet-500/50 hover:bg-slate-100/80 dark:hover:bg-white/[0.07] px-3 rounded-lg text-sm text-slate-500 dark:text-gray-400 transition-all duration-200"
				>
					<Search className="w-4 h-4" />
					<span className="hidden sm:inline">Buscar</span>
					<kbd className="hidden md:inline-flex items-center px-1.5 h-5 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-[10px] font-semibold text-slate-400 dark:text-gray-500">
						⌘K
					</kbd>
				</button>
				<Separator />
				<ChatButton variant="inline" />
				<Separator />
				<SupportNotificationsBell />
				<ThemeToggle />
				<Separator responsive />
				<Link
					href="/store"
					className="h-9 flex items-center gap-2 bg-linear-to-br from-slate-100 to-slate-200 dark:from-white/8 dark:to-white/3 border border-slate-200 dark:border-white/10 hover:from-blue-50 hover:to-slate-100 dark:hover:from-white/12 dark:hover:to-white/6 px-3 rounded-lg text-sm text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 shadow-sm dark:shadow-none"
				>
					<Store className="w-4 h-4" />
					<span className="hidden lg:inline">Ver loja</span>
				</Link>
				<Link
					href="/course"
					className="h-9 flex items-center gap-2 bg-linear-to-br from-slate-100 to-slate-200 dark:from-white/8 dark:to-white/3 border border-slate-200 dark:border-white/10 hover:from-blue-50 hover:to-slate-100 dark:hover:from-white/12 dark:hover:to-white/6 px-3 rounded-lg text-sm text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 shadow-sm dark:shadow-none"
				>
					<BookOpen className="w-4 h-4" />
					<span className="hidden lg:inline">Ver cursos</span>
				</Link>
				<Separator responsive />
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

						{/* Ações compactas: ⌘K */}
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
							{/* Pins */}
							{toolNav.length > 0 && (
								<div>
									<p className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-600">
										Fixados
									</p>
									<div className="space-y-0.5">
										{toolNav.map((tool) => {
											const active = isActive(tool.href);
											const ToolIcon = tool.icon;
											return (
												<Link
													key={tool.toolKey}
													href={tool.href}
													onClick={() => setMobileOpen(false)}
													className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
														active
															? ACTIVE_CLASSES
															: `text-slate-600 dark:text-gray-300 ${HOVER_CLASSES}`
													}`}
												>
													<ToolIcon className="w-4 h-4 shrink-0" />
													<span className="truncate">{tool.name}</span>
												</Link>
											);
										})}
									</div>
								</div>
							)}

							{/* Seções */}
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
																: `text-slate-600 dark:text-gray-300 ${HOVER_CLASSES}`
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

							{/* Link para o Hub de Ferramentas (sempre disponível p/ quem vê) */}
							{canSeeNavItem('Ferramentas', can) && (
								<Link
									href="/ferramentas/hub"
									onClick={() => setMobileOpen(false)}
									className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
										isActive('/ferramentas/hub')
											? ACTIVE_CLASSES
											: `text-slate-600 dark:text-gray-300 ${HOVER_CLASSES}`
									}`}
								>
									<Wrench className="w-4 h-4 shrink-0" />
									<span className="truncate">Ferramentas</span>
								</Link>
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
