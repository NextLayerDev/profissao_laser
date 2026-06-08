'use client';

import { CreditCard, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { VoxxysIcon } from '@/components/ui/voxxys-icon';
import { formatCurrency } from '@/utils/format-currency';
import { formatDate } from '@/utils/formatDate';
import { usePlanRefunds, useVoxRefunds } from '../hooks/use-analytics';
import type { RefundRow } from '../types/analytics';

type SubTab = 'plans' | 'vox';

function RefundTable({
	rows,
	isLoading,
	error,
}: {
	rows: RefundRow[];
	isLoading: boolean;
	error: unknown;
}) {
	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center py-16 text-red-400 text-sm">
				Erro ao carregar reembolsos.
			</div>
		);
	}

	return (
		<div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-transparent shadow-sm dark:shadow-none">
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-gray-400 text-left">
							<th className="px-4 py-3 font-medium">Cliente</th>
							<th className="px-4 py-3 font-medium hidden md:table-cell">
								E-mail
							</th>
							<th className="px-4 py-3 font-medium">Valor</th>
							<th className="px-4 py-3 font-medium hidden lg:table-cell">
								ID Reembolso
							</th>
							<th className="px-4 py-3 font-medium">Data</th>
						</tr>
					</thead>
					<tbody>
						{rows.length === 0 ? (
							<tr>
								<td
									colSpan={5}
									className="px-4 py-12 text-center text-slate-500 dark:text-gray-500"
								>
									Nenhum reembolso encontrado.
								</td>
							</tr>
						) : (
							rows.map((row) => (
								<tr
									key={row.id}
									className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
								>
									<td className="px-4 py-3">
										<span className="font-medium text-slate-900 dark:text-white">
											{row.customer.name}
										</span>
										<span className="md:hidden block text-xs text-slate-500 dark:text-gray-400 mt-0.5">
											{row.customer.email}
										</span>
									</td>
									<td className="px-4 py-3 hidden md:table-cell text-slate-600 dark:text-gray-400">
										{row.customer.email}
									</td>
									<td className="px-4 py-3 tabular-nums font-medium text-slate-900 dark:text-white">
										{formatCurrency(row.amount_cents / 100, 'BRL')}
									</td>
									<td className="px-4 py-3 hidden lg:table-cell">
										<span className="font-mono text-xs text-slate-500 dark:text-gray-400">
											{row.stripe_refund_id}
										</span>
									</td>
									<td className="px-4 py-3 tabular-nums text-slate-700 dark:text-gray-300">
										{formatDate(row.created_at)}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}

export function RefundsSection() {
	const [activeTab, setActiveTab] = useState<SubTab>('plans');

	const {
		data: planRows = [],
		isLoading: planLoading,
		error: planError,
	} = usePlanRefunds();
	const {
		data: voxRows = [],
		isLoading: voxLoading,
		error: voxError,
	} = useVoxRefunds();

	return (
		<div className="space-y-4">
			{/* Sub-tabs */}
			<div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 rounded-xl p-1 w-fit">
				<button
					type="button"
					onClick={() => setActiveTab('plans')}
					className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
						activeTab === 'plans'
							? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
							: 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
					}`}
				>
					<CreditCard className="w-4 h-4" />
					Assinaturas
					{!planLoading && (
						<span className="ml-1 text-xs bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
							{planRows.length}
						</span>
					)}
				</button>
				<button
					type="button"
					onClick={() => setActiveTab('vox')}
					className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
						activeTab === 'vox'
							? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
							: 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
					}`}
				>
					<VoxxysIcon className="w-4 h-4" />
					VOX
					{!voxLoading && (
						<span className="ml-1 text-xs bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
							{voxRows.length}
						</span>
					)}
				</button>
			</div>

			{activeTab === 'plans' && (
				<RefundTable
					rows={planRows}
					isLoading={planLoading}
					error={planError}
				/>
			)}
			{activeTab === 'vox' && (
				<RefundTable rows={voxRows} isLoading={voxLoading} error={voxError} />
			)}
		</div>
	);
}
