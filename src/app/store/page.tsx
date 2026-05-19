'use client';

import { BookOpen, CalendarClock, LayoutDashboard, Store } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { StoreContent } from '@/components/store/store-content';
import { UserBadge } from '@/components/store/user-badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { getCurrentUser, getToken } from '@/lib/auth';

export default function Loja() {
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		const user = getCurrentUser();
		setIsAdmin(!!getToken('user') && user?.role != null);
	}, []);

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] text-slate-900 dark:text-white font-sans">
			<header className="border-b border-slate-200 dark:border-gray-800 bg-slate-50/80 dark:bg-[#0d0d0f]/80 backdrop-blur-sm sticky top-0 z-10">
				<div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex flex-wrap items-center justify-between gap-4 md:gap-6">
					<div className="flex items-center gap-2">
						<Store className="w-6 h-6 text-violet-400" />
						<span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
							Profissão Laser
						</span>
					</div>

					<ThemeToggle />
					{isAdmin && (
						<Link
							href="/dashboard"
							className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 hover:border-violet-500/50 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium rounded-xl transition-colors shadow-sm dark:shadow-none"
						>
							<LayoutDashboard className="w-4 h-4" />
							Painel
						</Link>
					)}

					<Link
						href="/course"
						className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 hover:border-violet-500/50 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium rounded-xl transition-colors shadow-sm dark:shadow-none"
					>
						<BookOpen className="w-4 h-4" />
						Meus Cursos
					</Link>

					<Link
						href="/agendamentos"
						className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
					>
						<CalendarClock className="w-4 h-4" />
						Agendamentos
					</Link>

					<UserBadge />
				</div>
			</header>

			<main className="max-w-6xl mx-auto px-4 md:px-6 py-10">
				<StoreContent />
			</main>
		</div>
	);
}
