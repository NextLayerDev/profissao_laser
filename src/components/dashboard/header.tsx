'use client';

import { BookOpen, Search, Store } from 'lucide-react';
import Link from 'next/link';
import { ChatButton } from '@/components/dashboard/chat-button';
import { SupportNotificationsBell } from '@/components/dashboard/support-notifications-bell';
import { UserBadge } from '@/components/store/user-badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { useCommandPalette } from '@/components/tools/use-command-palette';

function Separator({ responsive }: { responsive?: boolean }) {
	return (
		<div
			className={`w-px h-5 bg-slate-200 dark:bg-white/10 shrink-0 ${
				responsive ? 'hidden lg:block' : ''
			}`}
		/>
	);
}

export function Header() {
	const { open: openPalette } = useCommandPalette();
	return (
		<header className="h-[64px] px-4 md:px-8 flex items-center justify-between border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#040405]/90 backdrop-blur-sm sticky top-0 z-30">
			<div>
				<h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">
					Gerenciamento
				</h1>
				<p className="text-slate-500 dark:text-gray-500 text-xs mt-0.5">
					Controle completo do seu negócio digital
				</p>
			</div>
			<div className="flex items-center gap-2">
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
		</header>
	);
}
