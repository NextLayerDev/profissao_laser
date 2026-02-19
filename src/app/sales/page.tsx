'use client';

import { ExternalLink } from 'lucide-react';
import { ChatButton } from '@/components/dashboard/chat-button';
import { Header } from '@/components/dashboard/header';
import { useSales } from '@/hooks/use-sales';
import { STATUS_LABELS } from '@/utils/constants/status-label';
import { formatCurrency } from '@/utils/format-currency';
import { formatDate } from '@/utils/formatDate';

export default function Vendas() {
	const { sales, isLoading, error } = useSales();

	return (
		<div className="min-h-screen bg-[#0d0d0f] text-white font-sans">
			<Header />

			<main className="px-8 py-6">
				<div className="mb-6">
					<h2 className="text-2xl font-bold tracking-tight">Vendas</h2>
					<p className="text-gray-400 mt-1">
						Lista de todos os usuários que realizaram compras e o que
						adquiriram.
					</p>
				</div>

				{isLoading && (
					<div className="flex items-center justify-center py-20 text-gray-400">
						Carregando vendas...
					</div>
				)}

				{error && (
					<div className="flex items-center justify-center py-20 text-red-400">
						Erro ao carregar vendas.
					</div>
				)}

				{!isLoading && !error && (
					<div className="rounded-xl border border-white/10 overflow-hidden">
						<table className="w-full text-sm">
							<thead>
								<tr className="bg-white/5 text-gray-400 text-left">
									<th className="px-4 py-3 font-medium">Usuário</th>
									<th className="px-4 py-3 font-medium">E-mail</th>
									<th className="px-4 py-3 font-medium">Produto</th>
									<th className="px-4 py-3 font-medium">Valor</th>
									<th className="px-4 py-3 font-medium">Status</th>
									<th className="px-4 py-3 font-medium">Data</th>
									<th className="px-4 py-3 font-medium">Recibo</th>
								</tr>
							</thead>
							<tbody>
								{(!sales || sales.length === 0) && (
									<tr>
										<td
											colSpan={7}
											className="px-4 py-10 text-center text-gray-500"
										>
											Nenhuma venda encontrada.
										</td>
									</tr>
								)}
								{sales?.map((sale) => {
									const statusInfo = STATUS_LABELS[sale.status] ?? {
										label: sale.status,
										color: 'bg-gray-500/10 text-gray-400',
									};

									return (
										<tr
											key={sale.id}
											className="border-t border-white/5 hover:bg-white/2 transition-colors"
										>
											<td className="px-4 py-3 font-medium">
												{sale.customer.name}
											</td>
											<td className="px-4 py-3 text-gray-400">
												{sale.customer.email}
											</td>
											<td className="px-4 py-3">{sale.product}</td>
											<td className="px-4 py-3 tabular-nums">
												{formatCurrency(sale.amount, sale.currency ?? 'BRL')}
											</td>
											<td className="px-4 py-3">
												<span
													className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
												>
													{statusInfo.label}
												</span>
											</td>
											<td className="px-4 py-3 text-gray-400 tabular-nums">
												{formatDate(sale.date)}
											</td>
											<td className="px-4 py-3">
												{sale.receipt_url ? (
													<a
														href={sale.receipt_url}
														target="_blank"
														rel="noopener noreferrer"
														className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
													>
														Ver
														<ExternalLink size={13} />
													</a>
												) : (
													<span className="text-gray-600">—</span>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</main>

			<ChatButton />
		</div>
	);
}
