'use client';

import { ChevronLeft, ChevronRight, Home, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { quickAccessItems } from '@/utils/constants/quick-access';

interface CourseSidebarProps {
	isCollapsed: boolean;
	onToggle: () => void;
}

export function CourseSidebar({ isCollapsed, onToggle }: CourseSidebarProps) {
	const pathname = usePathname();

	return (
		<nav
			className={`hidden md:flex fixed left-0 top-0 h-screen border-r border-slate-200 dark:border-white/5 bg-white dark:bg-[#06070a] overflow-hidden z-40 flex-col transition-all duration-300 ${
				isCollapsed ? 'w-16 p-2' : 'w-60 p-4'
			}`}
		>
			<div className="hidden dark:block absolute inset-0 pointer-events-none">
				<div className="absolute inset-0 bg-linear-to-b from-[#050507] via-[#040405] to-[#020203]" />
				<div className="absolute top-0 left-0 w-full h-48 bg-blue-950/10 blur-3xl rounded-full" />
				<div className="absolute bottom-0 right-0 w-32 h-48 bg-indigo-950/8 blur-3xl rounded-full" />
			</div>

			<div className="relative z-10 flex flex-col h-full">
				{/* Logo */}
				<div
					className={`flex items-center mb-4 ${isCollapsed ? 'justify-center py-5' : 'justify-between px-2 py-5'}`}
				>
					{!isCollapsed && (
						<div className="flex items-center gap-3">
							<div className="w-9 h-9 rounded-lg bg-linear-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
								<Zap className="w-4 h-4 text-white fill-white" />
							</div>
							<div>
								<h1 className="text-sm font-bold bg-linear-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent leading-tight">
									COMUNIDADE
								</h1>
								<span className="text-[10px] font-semibold text-slate-400 tracking-wide">
									PROFISSAO LASER
								</span>
							</div>
						</div>
					)}
					{isCollapsed && (
						<div className="w-9 h-9 rounded-lg bg-linear-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
							<Zap className="w-4 h-4 text-white fill-white" />
						</div>
					)}
				</div>

				{/* Nav items */}
				<div className="flex-1 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
					{/* Inicio */}
					<SidebarLink
						href="/course"
						label="Inicio"
						Icon={Home}
						isActive={pathname === '/course'}
						isCollapsed={isCollapsed}
					/>

					{/* Quick access items */}
					{quickAccessItems.map((item) => {
						const isActive = !!item.href && pathname.startsWith(item.href);

						if (!item.href) {
							return (
								<button
									key={item.label}
									type="button"
									title={isCollapsed ? item.label : undefined}
									onClick={() =>
										toast('Em breve', {
											description: `${item.label} estara disponivel em breve!`,
										})
									}
									className={sidebarItemClass(false, isCollapsed)}
								>
									<item.Icon className="w-5 h-5 shrink-0" />
									{!isCollapsed && (
										<span className="font-medium text-sm group-hover:translate-x-0.5 transition-transform truncate">
											{item.label}
										</span>
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

				{/* Toggle button at bottom */}
				<div className="pt-2 mt-2 border-t border-slate-200 dark:border-white/5">
					<button
						type="button"
						onClick={onToggle}
						title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
						className={`w-full flex items-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/8 transition-colors ${
							isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
						}`}
					>
						{isCollapsed ? (
							<ChevronRight className="w-4 h-4" />
						) : (
							<>
								<ChevronLeft className="w-4 h-4" />
								<span className="font-medium text-sm">Recolher menu</span>
							</>
						)}
					</button>
				</div>
			</div>
		</nav>
	);
}

function sidebarItemClass(isActive: boolean, isCollapsed: boolean) {
	return `flex items-center rounded-lg transition-all duration-200 group relative ${
		isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-2.5'
	} ${
		isActive
			? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(108,56,255,0.4)]'
			: 'text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
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
			<Icon className="w-5 h-5 shrink-0" />
			{!isCollapsed && (
				<span
					className={`font-medium text-sm truncate ${isActive ? '' : 'group-hover:translate-x-0.5 transition-transform'}`}
				>
					{label}
				</span>
			)}
		</Link>
	);
}
