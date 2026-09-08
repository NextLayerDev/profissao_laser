'use client';

import { Loader2, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import {
	effectiveStatus,
	formatBRL,
	formatDate,
	LinkRowActions,
	LinkTableHead,
	PlanVoxesBadge,
	StatusBadge,
	useLinkRowActions,
} from '@/components/links/link-table-shared';
import { usePlanLinks, useUpdatePlanLinkStatus } from '@/hooks/use-plan-links';

/** Links Avançados: modo de entrada, plano, preço e duração definidos no link. */
export function CustomLinksTable() {
	const { data, isLoading } = usePlanLinks();
	const toggleMutation = useUpdatePlanLinkStatus();
	const rowActions = useLinkRowActions(toggleMutation.mutateAsync);
	const [copiedId, setCopiedId] = useState<string | null>(null);

	const links = data?.filter((l) => l.kind === 'custom');

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
				<SlidersHorizontal className="w-10 h-10 text-slate-400 dark:text-gray-700 mx-auto mb-4" />
				<p className="text-slate-600 dark:text-gray-400 font-medium">
					Nenhum link avançado criado
				</p>
				<p className="text-slate-500 dark:text-gray-600 text-sm mt-1">
					Gere um link definindo tudo: entrada grátis ou paga, plano, voxxys e
					duração.
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
						'Entrada',
						'Plano',
						'1º período',
						'Duração',
						'Voxxys de presente',
						'Voxxys do plano',
						'Usos',
						'Status',
						'Criado em',
						'Ações',
					]}
				/>
				<tbody>
					{links.map((link) => {
						const status = effectiveStatus(link);
						const isFree = link.access_mode === 'free';
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
									<span
										className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
											isFree
												? 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400'
												: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400'
										}`}
									>
										{isFree ? 'Grátis' : 'Pago'}
									</span>
								</td>
								<td className="py-3 px-4 text-slate-600 dark:text-gray-300">
									{link.plan_name ?? (
										<span className="text-slate-400 dark:text-gray-500">
											Sem plano
										</span>
									)}
								</td>
								<td className="py-3 px-4 text-slate-600 dark:text-gray-300">
									{isFree ? (
										<span className="text-emerald-600 dark:text-emerald-400 font-medium">
											R$ 0,00
										</span>
									) : link.first_period_cents != null ? (
										<>
											{formatBRL(link.first_period_cents)}
											<span className="text-slate-400 dark:text-gray-500 text-xs">
												/{link.interval === 'yearly' ? 'ano' : 'mês'}
											</span>
										</>
									) : (
										'—'
									)}
								</td>
								<td className="py-3 px-4 text-slate-600 dark:text-gray-300">
									{link.access_days != null ? `${link.access_days} dias` : '—'}
								</td>
								<td className="py-3 px-4">
									<span className="inline-flex items-center gap-1 text-violet-500 dark:text-violet-400 font-semibold">
										{link.vox_grant > 0 ? `+${link.vox_grant}` : '—'}
									</span>
								</td>
								<td className="py-3 px-4">
									{link.plan_id ? (
										<PlanVoxesBadge
											includes={link.grants_plan_voxes !== false}
										/>
									) : (
										<span className="text-slate-400 dark:text-gray-500">—</span>
									)}
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
								<td className="py-3 px-4 text-slate-500 dark:text-gray-500 text-xs">
									{formatDate(link.created_at)}
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
