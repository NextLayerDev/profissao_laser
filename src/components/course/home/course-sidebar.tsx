'use client';

import {
	Award,
	BookOpen,
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	FolderOpen,
	LayoutDashboard,
	Trophy,
	Users,
	Zap,
} from 'lucide-react';
import Link from 'next/link';

const NAV_ITEMS = [
	{ Icon: LayoutDashboard, label: 'Início', href: '/course', active: true },
	{ Icon: BookOpen, label: 'Cursos', href: '/course' },
	{ Icon: Users, label: 'Comunidade', href: '/comunity' },
	{ Icon: Trophy, label: 'Ranking', href: '#' },
	{ Icon: CalendarDays, label: 'Eventos', href: '#' },
	{ Icon: Award, label: 'Conquistas', href: '#' },
	{ Icon: FolderOpen, label: 'Biblioteca', href: '/biblioteca-vetores' },
];

interface CourseSidebarProps {
	isCollapsed: boolean;
	onToggle: () => void;
}

export function CourseSidebar({ isCollapsed, onToggle }: CourseSidebarProps) {
	return (
		<nav
			className={`hidden md:flex fixed left-0 top-0 h-screen border-r border-slate-200 dark:border-white/5 bg-white dark:bg-[#06070a] overflow-hidden z-40 flex-col gap-1 transition-all duration-300 ${
				isCollapsed ? 'w-16 p-2' : 'w-60 p-4'
			}`}
		>
			{/* Dark mode gradient background */}
			<div className="hidden dark:block absolute inset-0 pointer-events-none">
				<div className="absolute inset-0 bg-linear-to-b from-[#050507] via-[#040405] to-[#020203]" />
				<div className="absolute top-0 left-0 w-full h-48 bg-blue-950/10 blur-3xl rounded-full" />
				<div className="absolute bottom-0 right-0 w-32 h-48 bg-indigo-950/8 blur-3xl rounded-full" />
			</div>
			<div className="relative z-10 flex flex-col h-full gap-1">
				{/* Logo + toggle */}
				<div
					className={`flex items-center mb-4 ${isCollapsed ? 'justify-center py-5' : 'justify-between px-2 py-5'}`}
				>
					{!isCollapsed && (
						<div className="flex items-center gap-3">
							<div className="w-9 h-9 rounded-lg bg-linear-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
								<Zap className="w-4 h-4 text-white fill-white" />
							</div>
							<div>
								<h1 className="text-base font-bold bg-linear-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent leading-tight">
									Profissão Laser
								</h1>
								<span className="text-[10px] text-slate-400">
									Mestria Profissional
								</span>
							</div>
						</div>
					)}

					<button
						type="button"
						onClick={onToggle}
						title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
						className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/8 transition-colors shrink-0"
					>
						{isCollapsed ? (
							<ChevronRight className="w-4 h-4" />
						) : (
							<ChevronLeft className="w-4 h-4" />
						)}
					</button>
				</div>

				{/* Nav items */}
				<div className="flex-1 overflow-y-auto space-y-1">
					{NAV_ITEMS.map(({ Icon, label, href, active }) => (
						<Link
							key={label}
							href={href}
							title={isCollapsed ? label : undefined}
							className={`flex items-center rounded-lg transition-all duration-200 group ${
								isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
							} ${
								active
									? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(108,56,255,0.4)]'
									: 'text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
							}`}
						>
							<Icon className="w-5 h-5 shrink-0" />
							{!isCollapsed && (
								<span
									className={`font-medium text-sm ${active ? '' : 'group-hover:translate-x-0.5 transition-transform'}`}
								>
									{label}
								</span>
							)}
						</Link>
					))}
				</div>

				{/* Bottom section: Upgrade */}
				<div className="border-t border-slate-200 dark:border-gray-800/50 pt-2">
					<Link
						href="/store"
						title={isCollapsed ? 'Upgrade PRO' : undefined}
						className={`w-full bg-linear-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg font-medium shadow-[0_0_15px_rgba(108,56,255,0.3)] hover:shadow-[0_0_20px_rgba(108,56,255,0.5)] transition-all flex items-center justify-center gap-2 ${
							isCollapsed ? 'p-3' : 'py-3 px-4'
						}`}
					>
						<Zap className="w-4 h-4 shrink-0" />
						{!isCollapsed && <span>Upgrade</span>}
					</Link>
				</div>
			</div>
		</nav>
	);
}
