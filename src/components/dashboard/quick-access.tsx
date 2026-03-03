'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { usePermissions } from '@/hooks/use-permissions';
import { quickAccessItems } from '@/utils/constants/dashboard';

export function QuickAccess() {
	const { canPrice } = usePermissions();

	const visibleItems = quickAccessItems.filter((item) => {
		if (item.href === '/reports' || item.href === '/sales') return canPrice;
		return true;
	});

	return (
		<div className="lg:col-span-2">
			<h3 className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-4">
				Acesso Rápido
			</h3>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{visibleItems.map((item) => (
					<Link
						key={item.title}
						href={item.href}
						className="flex items-center justify-between bg-white dark:bg-[#1a1a1d] rounded-2xl p-5 border border-slate-200 dark:border-gray-800/50 hover:border-violet-500/50 hover:bg-slate-50 dark:hover:bg-[#1f1f22] transition-all duration-300 group shadow-sm dark:shadow-none"
					>
						<div className="flex items-center gap-4">
							<div className={`${item.iconBg} p-3 rounded-xl`}>
								<item.icon className="w-5 h-5 text-white" />
							</div>
							<div className="text-left">
								<div className="font-semibold text-slate-900 dark:text-white">
									{item.title}
								</div>
								<div className="text-sm text-slate-500 dark:text-gray-500">
									{item.subtitle}
								</div>
							</div>
						</div>
						<ArrowRight className="w-5 h-5 text-slate-400 dark:text-gray-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
					</Link>
				))}
			</div>
		</div>
	);
}
