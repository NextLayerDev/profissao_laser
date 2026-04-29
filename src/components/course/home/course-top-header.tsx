'use client';

import { Search, Settings } from 'lucide-react';
import Link from 'next/link';
import { UserBadge } from '@/components/store/user-badge';
import { ThemeToggle } from '@/components/theme-toggle';

interface CourseTopHeaderProps {
	isAdmin: boolean;
	sidebarCollapsed: boolean;
}

export function CourseTopHeader({
	isAdmin,
	sidebarCollapsed,
}: CourseTopHeaderProps) {
	return (
		<header
			className={`fixed top-0 right-0 h-16 border-b border-slate-200 dark:border-gray-800/50 z-30 bg-white/80 dark:bg-[#040405]/90 backdrop-blur-lg flex items-center justify-between px-6 md:px-8 transition-all duration-300 ${
				sidebarCollapsed ? 'left-0 md:left-16' : 'left-0 md:left-60'
			}`}
		>
			<div className="flex-1 max-w-md">
				<div className="relative flex items-center bg-slate-100 dark:bg-gray-800/40 border border-slate-200 dark:border-gray-800/50 rounded-full overflow-hidden transition-all focus-within:border-violet-500/50">
					<Search className="absolute left-4 w-4 h-4 text-slate-400" />
					<input
						type="text"
						placeholder="Buscar na comunidade..."
						className="w-full bg-transparent border-none py-2 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
					/>
				</div>
			</div>

			<div className="flex items-center gap-2 ml-4">
				<ThemeToggle />
				{isAdmin && (
					<Link
						href="/dashboard"
						className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
					>
						<Settings className="w-5 h-5" />
					</Link>
				)}
				<UserBadge />
			</div>
		</header>
	);
}
