'use client';

import { usePermissions } from '@/modules/access';
import { useSalesAnalytics } from '@/modules/analytics';
import { formatCurrency } from '@/utils/format-currency';
import { toTitleCase } from '@/utils/title-case';

const AVATAR_COLORS = [
	'bg-blue-700',
	'bg-purple-600',
	'bg-emerald-600',
	'bg-rose-600',
	'bg-amber-600',
	'bg-teal-600',
	'bg-indigo-600',
	'bg-pink-600',
];

function avatarColor(name: string) {
	let hash = 0;
	for (let i = 0; i < name.length; i++)
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string) {
	return name
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((w) => w[0].toUpperCase())
		.join('');
}

function timeAgo(dateStr: string) {
	const diff = Date.now() - new Date(dateStr).getTime();
	const days = Math.floor(diff / 86_400_000);
	const hours = Math.floor(diff / 3_600_000);
	const mins = Math.floor(diff / 60_000);
	if (days >= 1) return `${days}d atrás`;
	if (hours >= 1) return `${hours}h atrás`;
	return `${Math.max(1, mins)}m atrás`;
}

export function RecentActivity() {
	const { canPrice, can } = usePermissions();
	const { data, isLoading } = useSalesAnalytics({
		sort: 'created_at:desc',
		per_page: 8,
		page: 1,
	});

	// Atividade recente é de vendas: oculta sem permissão de ver vendas.
	if (!can('vendas.view')) return null;

	const recent = data?.data ?? [];

	return (
		<div>
			<h3 className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-4">
				Atividade Recente
			</h3>
			<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl border border-slate-200 dark:border-gray-800/50 overflow-hidden shadow-sm dark:shadow-none">
				{isLoading && (
					<div className="p-6 text-center text-slate-500 dark:text-gray-500 text-sm">
						Carregando...
					</div>
				)}
				{!isLoading && recent.length === 0 && (
					<div className="p-6 text-center text-slate-500 dark:text-gray-500 text-sm">
						Nenhuma atividade recente.
					</div>
				)}
				{!isLoading &&
					recent.map((sale, idx) => {
						const name = sale.customer.name?.trim() || sale.customer.email;
						const abbr = initials(name);
						const bg = avatarColor(name);
						const isLast = idx === recent.length - 1;
						return (
							<div
								key={sale.subscription_id}
								className={`flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors ${
									!isLast ? 'border-b border-slate-100 dark:border-white/5' : ''
								}`}
							>
								<div
									className={`w-9 h-9 ${bg} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}
								>
									{abbr || '?'}
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-slate-900 dark:text-white truncate">
										{toTitleCase(name)}
									</p>
									<p className="text-xs text-slate-500 dark:text-gray-500 truncate">
										{sale.plan.name}
									</p>
								</div>
								<div className="text-right shrink-0">
									{canPrice && (
										<p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
											{formatCurrency(sale.sale_value_cents / 100, 'BRL')}
										</p>
									)}
									<p className="text-xs text-slate-400 dark:text-gray-600">
										{timeAgo(sale.created_at)}
									</p>
								</div>
							</div>
						);
					})}
			</div>
		</div>
	);
}
