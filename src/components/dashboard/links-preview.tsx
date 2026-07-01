'use client';

import { Link2 } from 'lucide-react';
import Link from 'next/link';
import { usePlanLinks } from '@/hooks/use-plan-links';
import { usePermissions } from '@/modules/access';
import type { PlanLinkListItem } from '@/types/plan-link';

const PREVIEW_COUNT = 4;

const KIND_LABEL: Record<PlanLinkListItem['kind'], string> = {
	monthly_choice: 'Mensal',
	annual_fixed: 'Anual',
};

const STATUS_STYLES: Record<PlanLinkListItem['status'], string> = {
	active: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
	disabled: 'bg-slate-500/15 text-slate-500',
};

const STATUS_LABELS: Record<PlanLinkListItem['status'], string> = {
	active: 'Ativo',
	disabled: 'Desativado',
};

export function LinksPreview() {
	const { data, isLoading } = usePlanLinks();
	const { can } = usePermissions();

	if (!can('planos.view')) return null;

	const preview = [...(data ?? [])]
		.sort(
			(a, b) =>
				new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
		)
		.slice(0, PREVIEW_COUNT);

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">
					Links
				</h3>
				<Link
					href="/links"
					className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
				>
					Ver todos
				</Link>
			</div>
			<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl border border-slate-200 dark:border-gray-800/50 overflow-hidden shadow-sm dark:shadow-none">
				{isLoading && (
					<div className="p-6 text-center text-slate-500 dark:text-gray-500 text-sm">
						Carregando...
					</div>
				)}
				{!isLoading && preview.length === 0 && (
					<div className="flex flex-col items-center py-8 text-slate-400 dark:text-gray-600">
						<Link2 className="w-6 h-6 mb-2" />
						<p className="text-sm">Nenhum link de plano criado.</p>
					</div>
				)}
				{!isLoading &&
					preview.map((link, idx) => {
						const isLast = idx === preview.length - 1;
						return (
							<Link
								key={link.id}
								href="/links"
								className={`flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors ${
									!isLast ? 'border-b border-slate-100 dark:border-white/5' : ''
								}`}
							>
								<div className="w-9 h-9 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
									<Link2 className="w-4 h-4 text-violet-500" />
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-slate-900 dark:text-white truncate">
										{link.plan_name ?? KIND_LABEL[link.kind]}
									</p>
									<p className="text-xs text-slate-500 dark:text-gray-500">
										{link.current_redemptions} resgate
										{link.current_redemptions === 1 ? '' : 's'}
										{link.max_redemptions ? ` de ${link.max_redemptions}` : ''}
									</p>
								</div>
								<span
									className={`text-xs px-2 py-0.5 rounded-md font-medium shrink-0 ${STATUS_STYLES[link.status]}`}
								>
									{STATUS_LABELS[link.status]}
								</span>
							</Link>
						);
					})}
			</div>
		</div>
	);
}
