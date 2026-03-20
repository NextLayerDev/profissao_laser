'use client';

import { ChevronDown, Store } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChatButton } from '@/components/dashboard/chat-button';
import { UserBadge } from '@/components/store/user-badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { usePermissions } from '@/hooks/use-permissions';
import { navItems } from '@/utils/constants/navigation';

export function Header() {
	const pathname = usePathname();
	const { canAdmin, canPrice } = usePermissions();

	const visibleNavItems = navItems.filter((item) => {
		if (item.name === 'Acessos') return canAdmin;
		if (
			item.name === 'Vendas' ||
			item.name === 'Relatórios' ||
			item.name === 'Links'
		)
			return canPrice;
		return true;
	});

	return (
		<header className="px-8 pt-8 pb-4">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
						Gerenciamento
					</h1>
					<p className="text-slate-600 dark:text-gray-400 mt-1">
						Controle completo do seu negócio digital
					</p>
				</div>
				<div className="flex items-center gap-3">
					<ChatButton variant="inline" />
					<ThemeToggle />
					<Link
						href="/store"
						className="flex items-center gap-2 bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 hover:border-violet-500/50 px-3 py-1.5 rounded-xl text-sm text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
					>
						<Store className="w-4 h-4" />
						Ver loja
					</Link>
					<Link
						href="/course"
						className="flex items-center gap-2 bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 hover:border-violet-500/50 px-3 py-1.5 rounded-xl text-sm text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
					>
						<Store className="w-4 h-4" />
						Ver cursos
					</Link>
					<UserBadge />
				</div>
			</div>

			<nav className="flex items-center gap-2 bg-slate-100 dark:bg-[#1a1a1d] p-1.5 rounded-2xl border border-slate-200 dark:border-gray-800/50">
				{visibleNavItems.map((item) => (
					<Link
						key={item.name}
						href={item.href}
						className={`flex flex-1 items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
							pathname === item.href
								? 'bg-white dark:bg-[#252528] text-slate-900 dark:text-white shadow-lg'
								: 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-[#252528]/50'
						}`}
					>
						<item.icon className="w-4 h-4" />
						{item.name}
						{item.hasDropdown && (
							<ChevronDown className="w-3 h-3 ml-1 opacity-60" />
						)}
					</Link>
				))}
			</nav>
		</header>
	);
}
