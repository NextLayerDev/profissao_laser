'use client';

import { Copy, Gift, Loader2, Power, PowerOff } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	usePromoLinks,
	useTogglePromoLinkStatus,
} from '@/hooks/use-promo-links';

const STATUS_STYLES: Record<string, string> = {
	active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
	inactive: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
	exhausted: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
	expired: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const STATUS_LABELS: Record<string, string> = {
	active: 'Ativo',
	inactive: 'Inativo',
	exhausted: 'Esgotado',
	expired: 'Expirado',
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

interface PromoLinksTableProps {
	productName?: string;
}

export function PromoLinksTable({ productName }: PromoLinksTableProps) {
	const { promoLinks, isLoading } = usePromoLinks();
	const toggleMutation = useTogglePromoLinkStatus();
	const [copiedId, setCopiedId] = useState<string | null>(null);

	const filtered = productName
		? promoLinks.filter((l) => l.productName === productName)
		: promoLinks;

	async function copyLink(token: string, id: string) {
		const url = `${window.location.origin}/promo-link/${token}`;
		try {
			await navigator.clipboard.writeText(url);
			setCopiedId(id);
			toast.success('Link copiado!');
			setTimeout(() => setCopiedId(null), 2000);
		} catch {
			toast.error('Erro ao copiar link');
		}
	}

	async function handleToggleStatus(id: string, currentStatus: string) {
		const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
		try {
			await toggleMutation.mutateAsync({ id, status: newStatus });
			toast.success(
				newStatus === 'active' ? 'Link ativado!' : 'Link desativado!',
			);
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

	if (filtered.length === 0) {
		return (
			<div className="text-center py-20">
				<Gift className="w-10 h-10 text-slate-400 dark:text-gray-700 mx-auto mb-4" />
				<p className="text-slate-600 dark:text-gray-400 font-medium">
					Nenhum link promocional encontrado
				</p>
				<p className="text-slate-500 dark:text-gray-600 text-sm mt-1">
					Links promocionais criados aparecerão aqui.
				</p>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b border-slate-200 dark:border-gray-800">
						<th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-gray-500">
							Produto
						</th>
						<th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-gray-500">
							Desconto
						</th>
						<th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-gray-500">
							Usos
						</th>
						<th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-gray-500">
							Duração
						</th>
						<th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-gray-500">
							Status
						</th>
						<th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-gray-500">
							Criado em
						</th>
						<th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-gray-500">
							Expira em
						</th>
						<th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-gray-500">
							Ações
						</th>
					</tr>
				</thead>
				<tbody>
					{filtered.map((link) => {
						const canToggle =
							link.status === 'active' || link.status === 'inactive';

						return (
							<tr
								key={link.id}
								className="border-b border-slate-100 dark:border-gray-800/50 hover:bg-slate-50 dark:hover:bg-[#1a1a1d]/50 transition-colors"
							>
								<td className="py-3 px-4 text-slate-900 dark:text-white font-medium">
									{link.productName}
								</td>
								<td className="py-3 px-4">
									<span className="inline-flex items-center gap-1 text-emerald-500 dark:text-emerald-400 font-semibold">
										{link.discountPercent}%
									</span>
								</td>
								<td className="py-3 px-4 text-slate-600 dark:text-gray-300">
									<span className="font-medium text-slate-900 dark:text-white">
										{link.currentRedemptions}
									</span>
									<span className="text-slate-400 dark:text-gray-500">
										/{link.maxRedemptions}
									</span>
								</td>
								<td className="py-3 px-4 text-slate-600 dark:text-gray-400">
									{link.durationMonths}{' '}
									{link.durationMonths === 1 ? 'mês' : 'meses'}
								</td>
								<td className="py-3 px-4">
									<span
										className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLES[link.status] ?? STATUS_STYLES.active}`}
									>
										{STATUS_LABELS[link.status] ?? link.status}
									</span>
								</td>
								<td className="py-3 px-4 text-slate-500 dark:text-gray-500 text-xs">
									{formatDate(link.createdAt)}
								</td>
								<td className="py-3 px-4 text-slate-500 dark:text-gray-500 text-xs">
									{link.expiresAt ? formatDate(link.expiresAt) : '—'}
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
										{canToggle && (
											<button
												type="button"
												onClick={() => handleToggleStatus(link.id, link.status)}
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
										)}
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
