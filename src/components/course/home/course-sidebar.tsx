'use client';

import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { useEntitlements } from '@/hooks/use-entitlements';
import { getToken } from '@/lib/auth';
import { useExtraToolNav } from '@/modules/tools/hooks/use-extra-tool-nav';
import {
	type QuickAccessItem,
	quickAccessItems,
} from '@/utils/constants/quick-access';

interface CourseSidebarProps {
	isCollapsed: boolean;
	onToggle: () => void;
	mobile?: boolean;
}

// Sidebar (nav lateral): Conteudo / Comunidade primeiro, Ferramentas no fim.
// O painel de "Acesso Rápido" da home usa ordem diferente (Ferramentas em
// primeiro) — ver SECTION_ORDER em quick-access-grid.tsx.
const SECTIONS = ['CONTEUDO', 'COMUNIDADE', 'FERRAMENTAS'] as const;

export function CourseSidebar({
	isCollapsed,
	onToggle,
	mobile,
}: CourseSidebarProps) {
	const pathname = usePathname();
	// Tools publicadas pela Fábrica (sem tela própria) entram dinamicamente.
	const extraTools = useExtraToolNav();
	const isStaff = typeof window !== 'undefined' && !!getToken('user');
	const { isTestUnlimited, hasActiveSubscription } = useEntitlements();
	const hasFullAccess = isStaff || isTestUnlimited || hasActiveSubscription;
	// Dedup por label: uma tool que já é destaque ESTÁTICO e que o aluno também
	// FIXOU (extraTools) apareceria 2x — mantém a 1ª (estática) e descarta a pinada.
	const seenLabels = new Set<string>();
	const allItems = [...quickAccessItems, ...extraTools]
		.filter((i) => !i.hideWhenSubscribed || !hasFullAccess)
		.filter((i) => {
			if (seenLabels.has(i.label)) return false;
			seenLabels.add(i.label);
			return true;
		});

	const grouped = SECTIONS.reduce(
		(acc, section) => {
			acc[section] = allItems.filter((i) => i.section === section);
			return acc;
		},
		{} as Record<string, QuickAccessItem[]>,
	);

	return (
		<nav
			className={`${mobile ? 'flex' : 'hidden md:flex'} fixed left-0 top-0 h-screen border-r border-slate-200 dark:border-white/10 bg-white dark:bg-[#06070a] overflow-hidden z-40 flex-col transition-all duration-300 ${
				isCollapsed && !mobile ? 'w-16 p-2' : 'w-60 p-4'
			}`}
		>
			<div className="flex flex-col h-full">
				{/* Logo */}
				<div
					className={`flex items-center mb-4 ${isCollapsed ? 'justify-center py-5' : 'justify-between px-2 py-5'}`}
				>
					{!isCollapsed ? (
						<div className="flex items-center gap-2.5">
							<span className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
								PL
							</span>
							<span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
						</div>
					) : (
						<span className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
							P
						</span>
					)}
				</div>

				{/* Nav items */}
				<div className="flex-1 overflow-y-auto space-y-1">
					<SidebarLink
						href="/course"
						label="Inicio"
						Icon={Home}
						isActive={pathname === '/course'}
						isCollapsed={isCollapsed}
					/>

					{SECTIONS.map((section) => (
						<div key={section}>
							{!isCollapsed && (
								<p className="px-4 pt-5 pb-1.5 text-[10px] font-semibold tracking-widest text-slate-400 dark:text-gray-500 uppercase">
									{section}
								</p>
							)}
							{isCollapsed && (
								<div className="my-2 mx-2 border-t border-slate-200 dark:border-white/10" />
							)}
							{grouped[section]?.map((item) => {
								const isActive = !!item.href && pathname.startsWith(item.href);

								if (!item.href) {
									// "Em breve" — sem rota ainda. Tratamento mudo/desabilitado pra
									// nao se confundir com um link funcional (mesmo que toaste).
									return (
										<button
											key={item.label}
											type="button"
											title={
												isCollapsed ? `${item.label} (em breve)` : undefined
											}
											onClick={() =>
												toast('Em breve', {
													description: `${item.label} estara disponivel em breve!`,
												})
											}
											className={`${sidebarItemClass(false, isCollapsed)} opacity-60 cursor-default`}
										>
											<item.Icon className="w-[18px] h-[18px] shrink-0" />
											{!isCollapsed && (
												<>
													<span className="text-sm truncate">{item.label}</span>
													<span className="ml-auto shrink-0 rounded-full bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400 dark:text-gray-500">
														em breve
													</span>
												</>
											)}
										</button>
									);
								}

								return (
									<SidebarLink
										key={item.label}
										href={item.href}
										label={item.label}
										Icon={item.Icon}
										isActive={isActive}
										isCollapsed={isCollapsed}
									/>
								);
							})}
						</div>
					))}
				</div>

				{/* Toggle */}
				<div className="pt-2 mt-2 border-t border-slate-200 dark:border-white/10">
					<button
						type="button"
						onClick={onToggle}
						title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
						className={`w-full flex items-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors ${
							isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
						}`}
					>
						{isCollapsed ? (
							<ChevronRight className="w-4 h-4" />
						) : (
							<>
								<ChevronLeft className="w-4 h-4" />
								<span className="text-sm">Recolher menu</span>
							</>
						)}
					</button>
				</div>
			</div>
		</nav>
	);
}

function sidebarItemClass(isActive: boolean, isCollapsed: boolean) {
	return `flex items-center rounded-lg transition-all duration-150 group relative ${
		isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-2'
	} ${
		isActive
			? 'text-violet-600 dark:text-violet-400 bg-violet-500/8 dark:bg-violet-500/10 border-l-[3px] border-violet-600'
			: 'text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
	}`;
}

function SidebarLink({
	href,
	label,
	Icon,
	isActive,
	isCollapsed,
}: {
	href: string;
	label: string;
	Icon: React.ComponentType<{ className?: string }>;
	isActive: boolean;
	isCollapsed: boolean;
}) {
	return (
		<Link
			href={href}
			title={isCollapsed ? label : undefined}
			className={sidebarItemClass(isActive, isCollapsed)}
		>
			<Icon className="w-[18px] h-[18px] shrink-0" />
			{!isCollapsed && <span className="text-sm truncate">{label}</span>}
		</Link>
	);
}
