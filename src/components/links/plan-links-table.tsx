'use client';

import { Copy, Link2, Loader2, Power, PowerOff } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { usePlanLinks, useUpdatePlanLinkStatus } from '@/hooks/use-plan-links';
import type { PlanLinkListItem } from '@/types/plan-link';

const STATUS_STYLES: Record<string, string> = {
	active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
	disabled: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
	expired: 'bg-red-500/10 text-red-400 border-red-500/20',
	exhausted: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const STATUS_LABELS: Record<string, string> = {
	active: 'Ativo',
	disabled: 'Desativado',
	expired: 'Expirado',
	exhausted: 'Esgotado',
};

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

/** Status efetivo pra exibição (expiração/esgotamento derivados no front). */
function effectiveStatus(link: PlanLinkListItem): string {
	if (link.status === 'disabled') return 'disabled';
	if (link.expires_at && new Date(link.expires_at) < new Date())
		return 'expired';
	if (
		link.max_redemptions !== null &&
		link.current_redemptions >= link.max_redemptions
	)
		return 'exhausted';
	return 'active';
}

export function PlanLinksTable() {
	const { data: links, isLoading } = usePlanLinks();
	const toggleMutation = useUpdatePlanLinkStatus();
	const [copiedId, setCopiedId] = useState<string | null>(null);

	async function copyLink(token: string, id: string) {
		const url = `${window.location.origin}/link-plano/${token}`;
		try {
			await navigator.clipboard.writeText(url);
			setCopiedId(id);
			toast.success('Link copiado!');
			setTimeout(() => setCopiedId(null), 2000);
		} catch {
			toast.error('Erro ao copiar link');
		}
	}

	async function handleToggle(link: PlanLinkListItem) {
		const next = link.status === 'active' ? 'disabled' : 'active';
		try {
			await toggleMutation.mutateAsync({ id: link.id, status: next });
			toast.success(next === 'active' ? 'Link ativado!' : 'Link desativado!');
		} catch {
			toast.error('Erro ao alterar status do link');
		}
	}

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
				<thead>
					<tr className="border-b border-slate-200 dark:border-gray-800">
						{[
							'Link',
							'Voxxys de presente',
							'Usos',
							'Status',
							'Criado por',
							'Criado em',
							'Expira em',
							'Ações',
						].map((h) => (
							<th
								key={h}
								className="text-left py-3 px-4 font-medium text-slate-400 dark:text-gray-600"
							>
								{h}
							</th>
						))}
					</tr>
				</thead>
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
								<td className="py-3 px-4 text-slate-600 dark:text-gray-300">
									<span className="font-medium text-slate-900 dark:text-white">
										{link.completed_redemptions}
									</span>
									<span className="text-slate-400 dark:text-gray-500">
										/{link.max_redemptions ?? '∞'}
									</span>
								</td>
								<td className="py-3 px-4">
									<span
										className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLES[status] ?? STATUS_STYLES.active}`}
									>
										{STATUS_LABELS[status] ?? status}
									</span>
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
									<div className="flex items-center gap-1">
										<button
											type="button"
											onClick={() => copyLink(link.token, link.id)}
											className={`p-2 rounded-lg transition-colors ${
												copiedId === link.id
													? 'bg-emerald-500/20 text-emerald-400'
													: 'text-slate-500 dark:text-gray-500 hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-[#252528]'
											}`}
											title="Copiar link"
										>
											<Copy className="w-4 h-4" />
										</button>
										<button
											type="button"
											onClick={() => handleToggle(link)}
											disabled={toggleMutation.isPending}
											className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
												link.status === 'active'
													? 'text-slate-500 dark:text-gray-500 hover:text-red-400 hover:bg-red-500/10'
													: 'text-slate-500 dark:text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10'
											}`}
											title={
												link.status === 'active'
													? 'Desativar link'
													: 'Ativar link'
											}
										>
											{link.status === 'active' ? (
												<PowerOff className="w-4 h-4" />
											) : (
												<Power className="w-4 h-4" />
											)}
										</button>
									</div>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
