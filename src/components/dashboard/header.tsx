'use client';

import { ChevronDown, Store } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserBadge } from '@/components/store/user-badge';
import { navItems } from '@/utils/constants/navigation';

export function Header() {
	const pathname = usePathname();

	return (
		<header className="px-8 pt-8 pb-4">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Gerenciamento</h1>
					<p className="text-gray-400 mt-1">
						Controle completo do seu negócio digital
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Link
						href="/store"
						className="flex items-center gap-2 bg-[#1a1a1d] border border-gray-800 hover:border-violet-500/50 px-3 py-1.5 rounded-xl text-sm text-gray-400 hover:text-white transition-all duration-200"
					>
						<Store className="w-4 h-4" />
						Ver loja
					</Link>
					<UserBadge />
				</div>
			</div>

			<nav className="flex items-center gap-2 bg-[#1a1a1d] p-1.5 rounded-2xl border border-gray-800/50">
				{navItems.map((item) => (
					<Link
						key={item.name}
						href={item.href}
						className={`flex flex-1 items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
							pathname === item.href
								? 'bg-[#252528] text-white shadow-lg'
								: 'text-gray-400 hover:text-white hover:bg-[#252528]/50'
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
