'use client';

import { Link2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import {
	effectiveStatus,
	formatDate,
	LinkRowActions,
	LinkTableHead,
	PlanVoxesBadge,
	StatusBadge,
	useLinkRowActions,
} from '@/components/links/link-table-shared';
import { usePlanLinks, useUpdatePlanLinkStatus } from '@/hooks/use-plan-links';

export function PlanLinksTable() {
	const { data, isLoading } = usePlanLinks();
	const toggleMutation = useUpdatePlanLinkStatus();
	const rowActions = useLinkRowActions(toggleMutation.mutateAsync);
	const [copiedId, setCopiedId] = useState<string | null>(null);

	// Esta aba lista só os links MENSAIS; os anuais têm aba própria.
	const links = data?.filter((l) => l.kind === 'monthly_choice');

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
			</div>
		);
	}

	if (!links || links.length === 0) {
		return (
			<div className="text-center py-20">
				<Link2 className="w-10 h-10 text-slate-400 dark:text-gray-700 mx-auto mb-4" />
				<p className="text-slate-600 dark:text-gray-400 font-medium">
					Nenhum link de plano criado
				</p>
				<p className="text-slate-500 dark:text-gray-600 text-sm mt-1">
					Gere um link especial para oferecer o 1º mês a preço de custo.
				</p>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm">
				<LinkTableHead
					columns={[
						'Link',
						'Voxxys de presente',
						'Voxxys do plano',
						'Usos',
						'Status',
						'Criado por',
						'Criado em',
						'Expira em',
						'Ações',
					]}
				/>
				<tbody>
					{links.map((link) => {
						const status = effectiveStatus(link);
						return (
							<tr
								key={link.id}
								className="border-b border-slate-100 dark:border-gray-800/50 hover:bg-slate-50 dark:hover:bg-[#1a1a1d]/50 transition-colors"
							>
								<td className="py-3 px-4">
									<code className="text-xs text-slate-600 dark:text-gray-400">
										…/link-plano/{link.token.slice(0, 8)}…
									</code>
								</td>
								<td className="py-3 px-4">
									<span className="inline-flex items-center gap-1 text-violet-500 dark:text-violet-400 font-semibold">
										{link.vox_grant > 0 ? `+${link.vox_grant}` : '—'}
									</span>
								</td>
								<td className="py-3 px-4">
									<PlanVoxesBadge includes={link.grants_plan_voxes !== false} />
								</td>
								<td className="py-3 px-4 text-slate-600 dark:text-gray-300">
									<span className="font-medium text-slate-900 dark:text-white">
										{link.completed_redemptions}
									</span>
									<span className="text-slate-400 dark:text-gray-500">
										/{link.max_redemptions ?? '∞'}
									</span>
								</td>
								<td className="py-3 px-4">
									<StatusBadge status={status} />
								</td>
								<td className="py-3 px-4 text-slate-600 dark:text-gray-400">
									{link.created_by_name ?? '—'}
								</td>
								<td className="py-3 px-4 text-slate-500 dark:text-gray-500 text-xs">
									{formatDate(link.created_at)}
								</td>
								<td className="py-3 px-4 text-slate-500 dark:text-gray-500 text-xs">
									{link.expires_at ? formatDate(link.expires_at) : '—'}
								</td>
								<td className="py-3 px-4">
									<LinkRowActions
										link={link}
										copied={copiedId === link.id}
										onCopy={() =>
											rowActions.copy(link.token, link.id, setCopiedId)
										}
										onToggle={() => rowActions.toggle(link)}
										toggling={toggleMutation.isPending}
									/>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
