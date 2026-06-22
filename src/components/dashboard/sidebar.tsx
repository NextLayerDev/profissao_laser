'use client';

import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/use-permissions';
import { useAdminToolNav } from '@/modules/tools/hooks/use-admin-tool-nav';
import { navItems } from '@/utils/constants/navigation';
import { canSeeNavItem } from '@/utils/constants/permissions';

interface Props {
	collapsed: boolean;
	onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: Props) {
	const pathname = usePathname();
	const { can, isSuperAdmin } = usePermissions();

	// Itens fixos (gateados por permissão) + tools da Fábrica publicadas (dinâmico:
	// qualquer tool publicada aparece no menu sem hardcode, ex.: Mentoria).
	const toolNav = useAdminToolNav(isSuperAdmin);
	const visibleNavItems = [
		...navItems.filter((item) => canSeeNavItem(item.name, can)),
		...toolNav,
	];

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

				{/* Nav items */}
				<nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
					{visibleNavItems.map((item) => {
						const isActive =
							pathname === item.href ||
							(item.href !== '/dashboard' &&
								pathname.startsWith(`${item.href}/`));
						return (
							<Link
								key={item.name}
								href={item.href}
								title={collapsed ? item.name : undefined}
								className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
									collapsed ? 'justify-center' : ''
								} ${
									isActive
										? 'bg-violet-600 text-white shadow-sm dark:shadow-md dark:shadow-purple-950/60'
										: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
								}`}
							>
								<item.icon className="w-5 h-5 shrink-0" />
								{!collapsed && <span>{item.name}</span>}
							</Link>
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
							Use os relatórios para acompanhar suas vendas em tempo real.
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
