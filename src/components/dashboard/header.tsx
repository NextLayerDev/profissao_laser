'use client';

import { BookOpen, Store } from 'lucide-react';
import Link from 'next/link';
import { ChatButton } from '@/components/dashboard/chat-button';
import { UserBadge } from '@/components/store/user-badge';
import { ThemeToggle } from '@/components/theme-toggle';

function Separator() {
	return <div className="w-px h-5 bg-slate-200 dark:bg-white/10 shrink-0" />;
}

export function Header() {
	return (
		<header className="h-[64px] px-8 flex items-center justify-between border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#040405]/90 backdrop-blur-sm sticky top-0 z-30">
			<div>
				<h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">
					Gerenciamento
				</h1>
				<p className="text-slate-500 dark:text-gray-500 text-xs mt-0.5">
					Controle completo do seu negócio digital
				</p>
			</div>
			<div className="flex items-center gap-2">
				<ChatButton variant="inline" />
				<Separator />
				<ThemeToggle />
				<Separator />
				<Link
					href="/store"
					className="h-9 flex items-center gap-2 bg-linear-to-br from-slate-100 to-slate-200 dark:from-white/8 dark:to-white/3 border border-slate-200 dark:border-white/10 hover:from-blue-50 hover:to-slate-100 dark:hover:from-white/12 dark:hover:to-white/6 px-3 rounded-lg text-sm text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 shadow-sm dark:shadow-none"
				>
					<Store className="w-4 h-4" />
					Ver loja
				</Link>
				<Link
					href="/course"
					className="h-9 flex items-center gap-2 bg-linear-to-br from-slate-100 to-slate-200 dark:from-white/8 dark:to-white/3 border border-slate-200 dark:border-white/10 hover:from-blue-50 hover:to-slate-100 dark:hover:from-white/12 dark:hover:to-white/6 px-3 rounded-lg text-sm text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 shadow-sm dark:shadow-none"
				>
					<BookOpen className="w-4 h-4" />
					Ver cursos
				</Link>
				<Separator />
				<UserBadge />
			</div>
		</header>
	);
}
