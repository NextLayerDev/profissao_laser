'use client';

import { Copy, Link2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { usePaymentLinks } from '@/hooks/use-payment-links';

const STATUS_STYLES: Record<string, string> = {
	active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
	used: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
	expired: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const STATUS_LABELS: Record<string, string> = {
	active: 'Ativo',
	used: 'Usado',
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

interface PaymentLinksTableProps {
	productName?: string;
}

export function PaymentLinksTable({ productName }: PaymentLinksTableProps) {
	const { paymentLinks, isLoading } = usePaymentLinks();
	const [copiedId, setCopiedId] = useState<string | null>(null);

	const filtered = productName
		? paymentLinks.filter((l) => l.productName === productName)
		: paymentLinks;

	async function copyLink(token: string, id: string) {
		const url = `${window.location.origin}/payment-link/${token}`;
		try {
			await navigator.clipboard.writeText(url);
			setCopiedId(id);
			toast.success('Link copiado!');
			setTimeout(() => setCopiedId(null), 2000);
		} catch {
			toast.error('Erro ao copiar link');
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
				<Link2 className="w-10 h-10 text-slate-400 dark:text-gray-700 mx-auto mb-4" />
				<p className="text-slate-600 dark:text-gray-400 font-medium">
					Nenhum link de pagamento encontrado
				</p>
				<p className="text-slate-500 dark:text-gray-600 text-sm mt-1">
					Links de pagamento criados para produtos aparecerão aqui.
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
							Cliente
						</th>
						<th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-gray-500">
							Empresa
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
					{filtered.map((link) => (
						<tr
							key={link.id}
							className="border-b border-slate-100 dark:border-gray-800/50 hover:bg-slate-50 dark:hover:bg-[#1a1a1d]/50 transition-colors"
						>
							<td className="py-3 px-4 text-slate-900 dark:text-white font-medium">
								{link.productName}
							</td>
							<td className="py-3 px-4 text-slate-600 dark:text-gray-300">
								<div>{link.customerName}</div>
								<div className="text-xs text-slate-400 dark:text-gray-500">
									{link.customerPhone ?? '—'}
								</div>
							</td>
							<td className="py-3 px-4 text-slate-600 dark:text-gray-400">
								{link.companyName}
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
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
