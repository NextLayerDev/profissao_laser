'use client';

import {
	BookOpen,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdminPendings } from '@/hooks/use-admin-pendings';
import { usePermissions } from '@/modules/access';
import { useAdminToolNav } from '@/modules/tools/hooks/use-admin-tool-nav';
import { usePinnedTools } from '@/modules/tools/hooks/use-pinned-tools';
import { ADMIN_SECTIONS } from '@/modules/tools/lib/tool-categories';
import type { NavItem } from '@/types/navigation';
import { navItems } from '@/utils/constants/navigation';
import { canSeeNavItem } from '@/utils/constants/permissions';

interface Props {
	collapsed: boolean;
	onToggle: () => void;
}

/** Rótulos humanos (PT-BR) das seções da topologia do admin. */
const SECTION_LABELS: Record<string, string> = {
	PRINCIPAL: 'Principal',
	CONTEUDO: 'Conteúdo',
	OPERACAO: 'Operação',
	FERRAMENTAS: 'Ferramentas',
	SISTEMA: 'Sistema',
};

/** Seção default p/ itens sem `section` declarada (não some do menu). */
const DEFAULT_SECTION = 'PRINCIPAL';

/** Chave do estado (aberto/fechado por seção) no localStorage. */
const OPEN_KEY = 'pl.sidebar.admin.sections';

/** Item da sidebar enriquecido p/ render — pode ser uma tool pinada (toolKey). */
interface RenderItem extends NavItem {
	/** Presente só nas ferramentas pinadas — habilita o "desafixar". */
	toolKey?: string;
}

/**
 * Estado aberto/fechado das seções colapsáveis, persistido em `localStorage`.
 * SSR-safe: no servidor tudo abre (sem flash de vazio); a leitura real acontece
 * num `useEffect` no cliente. `toggle` lê o estado vigente, grava e re-sincroniza.
 */
function useSectionOpenState(): {
	isOpen: (section: string) => boolean;
	toggle: (section: string) => void;
} {
	const [closed, setClosed] = useState<Record<string, boolean>>({});

	useEffect(() => {
		if (typeof window === 'undefined') return;
		try {
			const raw = window.localStorage.getItem(OPEN_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				if (parsed && typeof parsed === 'object') {
					setClosed(parsed as Record<string, boolean>);
				}
			}
		} catch {
			// note: storage negado/corrompido — tudo aberto, sem quebrar a UI.
		}
	}, []);

	const isOpen = useCallback(
		(section: string) => closed[section] !== true,
		[closed],
	);

	const toggle = useCallback((section: string) => {
		setClosed((prev) => {
			const next = { ...prev, [section]: !prev[section] };
			try {
				window.localStorage.setItem(OPEN_KEY, JSON.stringify(next));
			} catch {
				// note: persistência best-effort; estado segue só em memória.
			}
			return next;
		});
	}, []);

	return { isOpen, toggle };
}

export function Sidebar({ collapsed, onToggle }: Props) {
	const pathname = usePathname();
	const { can, isSuperAdmin } = usePermissions();

	// Tools da Fábrica PINADAS (gateadas no catálogo) + store de pins p/ desafixar.
	const toolNav = useAdminToolNav(isSuperAdmin);
	const { toggle: togglePin } = usePinnedTools('admin');

	const canSeeSuporte = canSeeNavItem('Suporte', can);
	const { supportTotal, forumUnanswered } = useAdminPendings(canSeeSuporte);

	/** Pendências por rota — badges nos itens da sidebar. */
	const badgeByHref: Record<string, number> = {
		'/suporte': supportTotal,
		'/forum': forumUnanswered,
	};

	const { isOpen, toggle: toggleSection } = useSectionOpenState();

	// Agrupa itens fixos (gateados) + tools pinadas por seção, na ordem canônica.
	const sections = useMemo(() => {
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
		// Tools pinadas entram na própria seção (vinda da categoria) — quase sempre
		// FERRAMENTAS, mas respeitamos a topologia caso a categoria diga outra.
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
			items: bySection.get(id) ?? [],
		})).filter((s) => s.items.length > 0);
	}, [can, toolNav]);

	const isActive = useCallback(
		(href: string) =>
			pathname === href ||
			(href !== '/dashboard' && pathname.startsWith(`${href}/`)),
		[pathname],
	);

	return (
		<aside
			className={`fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 overflow-hidden z-40 ${
				collapsed ? 'w-16' : 'w-56'
			} bg-white border-r border-slate-200 dark:bg-[#06070a] dark:border-white/5`}
		>
			{/* Dark mode gradient background */}
			<div className="hidden dark:block absolute inset-0 pointer-events-none">
				<div className="absolute inset-0 bg-linear-to-b from-[#050507] via-[#040405] to-[#020203]" />
				<div className="absolute top-0 left-0 w-full h-48 bg-blue-950/10 blur-3xl rounded-full" />
				<div className="absolute bottom-0 right-0 w-32 h-48 bg-indigo-950/8 blur-3xl rounded-full" />
			</div>

			{/* Content */}
			<div className="relative z-10 flex flex-col h-full">
				{/* Logo */}
				<div
					className={`h-16 flex items-center gap-3 px-4 shrink-0 border-b border-slate-200 dark:border-white/5 ${collapsed ? 'justify-center' : ''}`}
				>
					<div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 shadow-sm dark:shadow-lg dark:shadow-purple-950/60">
						<Image
							src="/favicon.png"
							alt="Profissão Laser"
							width={32}
							height={32}
							className="w-full h-full object-cover"
						/>
					</div>
					{!collapsed && (
						<span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
							Profissão Laser
						</span>
					)}
				</div>

				{/* Nav: seções colapsáveis */}
				<nav className="flex-1 px-2 py-2 overflow-y-auto">
					{sections.map((section) => {
						const open = isOpen(section.id);
						return (
							<div key={section.id} className="mb-1">
								{/* Header da seção — escondido no rail colapsado (vira só um separador) */}
								{collapsed ? (
									<div className="my-1.5 mx-2 h-px bg-slate-200 dark:bg-white/5" />
								) : (
									<button
										type="button"
										onClick={() => toggleSection(section.id)}
										aria-expanded={open}
										className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg group transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
									>
										<span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-600 group-hover:text-slate-600 dark:group-hover:text-gray-400 transition-colors">
											{section.label}
										</span>
										<ChevronDown
											className={`w-3.5 h-3.5 text-slate-400 dark:text-gray-600 transition-transform duration-200 ${
												open ? '' : '-rotate-90'
											}`}
										/>
									</button>
								)}

								{/* Itens da seção */}
								{(open || collapsed) && (
									<div className="mt-0.5 space-y-0.5">
										{section.items.map((item) => {
											const active = isActive(item.href);
											const badge = badgeByHref[item.href] ?? 0;
											return (
												<div key={item.name} className="relative group/item">
													<Link
														href={item.href}
														title={collapsed ? item.name : undefined}
														className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
															collapsed ? 'justify-center' : ''
														} ${
															active
																? 'bg-violet-600 text-white shadow-sm dark:shadow-md dark:shadow-purple-950/60'
																: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
														}`}
													>
														<span className="relative shrink-0">
															<item.icon className="w-5 h-5" />
															{badge > 0 && collapsed && (
																<span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#06070a]" />
															)}
														</span>
														{!collapsed && (
															<span className="flex items-center gap-2 min-w-0 flex-1">
																<span className="truncate">{item.name}</span>
																{badge > 0 && (
																	<span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white leading-none">
																		{badge > 99 ? '99+' : badge}
																	</span>
																)}
															</span>
														)}
													</Link>

													{/* Desafixar tool pinada (só no expandido) */}
													{!collapsed && item.toolKey && (
														<button
															type="button"
															onClick={() => togglePin(item.toolKey as string)}
															title="Desafixar do menu"
															aria-label={`Desafixar ${item.name}`}
															className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md opacity-0 group-hover/item:opacity-100 transition-opacity ${
																active
																	? 'text-white/80 hover:text-white hover:bg-white/15'
																	: 'text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:text-gray-600 dark:hover:text-gray-200 dark:hover:bg-white/10'
															}`}
														>
															<X className="w-3.5 h-3.5" />
														</button>
													)}
												</div>
											);
										})}
									</div>
								)}
							</div>
						);
					})}
				</nav>

				{/* Dica rápida */}
				{!collapsed && (
					<div className="mx-3 mb-3 p-3 rounded-xl bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/8">
						<div className="flex items-center gap-2 mb-1">
							<BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
							<span className="text-xs font-semibold text-slate-700 dark:text-gray-300">
								Dica rápida
							</span>
						</div>
						<p className="text-xs text-slate-500 dark:text-gray-500 leading-relaxed">
							Fixe suas ferramentas favoritas no hub para acessá-las direto por
							aqui.
						</p>
					</div>
				)}

				{/* Toggle button */}
				<div className="p-2 border-t border-slate-200 dark:border-white/5">
					<button
						type="button"
						onClick={onToggle}
						title={collapsed ? 'Expandir' : 'Minimizar'}
						className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-400 transition-colors ${
							collapsed ? 'justify-center' : ''
						}`}
					>
						{collapsed ? (
							<ChevronRight className="w-4 h-4" />
						) : (
							<>
								<ChevronLeft className="w-4 h-4" />
								<span>Minimizar</span>
							</>
						)}
					</button>
				</div>
			</div>
		</aside>
	);
}
