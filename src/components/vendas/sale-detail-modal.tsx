'use client';

import { AlertCircle, ExternalLink, X } from 'lucide-react';
import { useEffect } from 'react';
import type { Sales } from '@/types/sales';
import { STATUS_LABELS } from '@/utils/constants/status-label';
import { formatCurrency } from '@/utils/format-currency';
import { formatDate } from '@/utils/formatDate';
import { isTestRecord } from '@/utils/test-record-detector';
import { toTitleCase } from '@/utils/title-case';

interface Props {
	sale: Sales | null;
	isOpen: boolean;
	onClose: () => void;
	canPrice: boolean;
}

export function SaleDetailModal({ sale, isOpen, onClose, canPrice }: Props) {
	useEffect(() => {
		if (!isOpen) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, [isOpen, onClose]);

	if (!isOpen || !sale) return null;

	const isUnknown =
		sale.customer.name === 'Unknown' || !sale.customer.name.trim();
	const isTest = isTestRecord(sale);
	const statusInfo = STATUS_LABELS[sale.status] ?? {
		label: sale.status,
		color: 'bg-gray-500/10 text-gray-400',
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<button
				type="button"
				tabIndex={-1}
				aria-label="Fechar modal"
				className="absolute inset-0 bg-black/60 backdrop-blur-sm border-none cursor-default"
				onClick={onClose}
			/>
			<div className="relative bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-2xl w-full max-w-lg mx-4 p-6 shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between mb-6">
					<h3 className="text-lg font-semibold text-slate-900 dark:text-white">
						Detalhe da Venda
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-2 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#252528] transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Content */}
				<div className="space-y-4">
					<DetailRow label="Cliente">
						<div className="flex items-center gap-2">
							{isUnknown ? (
								<span className="flex items-center gap-1 text-slate-400 dark:text-gray-500">
									<AlertCircle className="w-4 h-4" />
									Sem cadastro
								</span>
							) : (
								<span className="text-slate-900 dark:text-white font-medium">
									{toTitleCase(sale.customer.name)}
								</span>
							)}
							{isTest && (
								<span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
									Teste
								</span>
							)}
						</div>
					</DetailRow>

					<DetailRow label="E-mail">
						<span
							className={
								isUnknown
									? 'text-amber-500 font-medium'
									: 'text-slate-900 dark:text-white'
							}
						>
							{sale.customer.email}
						</span>
					</DetailRow>

					{sale.customer.phone && (
						<DetailRow label="Telefone">
							<span className="text-slate-900 dark:text-white">
								{sale.customer.phone}
							</span>
						</DetailRow>
					)}

					<DetailRow label="Produto">
						<span className="text-slate-900 dark:text-white">
							{sale.product}
						</span>
					</DetailRow>

					{canPrice && (
						<DetailRow label="Valor">
							<span className="text-slate-900 dark:text-white font-medium tabular-nums">
								{formatCurrency(sale.amount, sale.currency ?? 'BRL')}
							</span>
						</DetailRow>
					)}

					<DetailRow label="Status">
						<span
							className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
						>
							{statusInfo.label}
						</span>
					</DetailRow>

					<DetailRow label="Data">
						<span className="text-slate-900 dark:text-white tabular-nums">
							{formatDate(sale.date)}
						</span>
					</DetailRow>

					<DetailRow label="ID do Pedido">
						<span className="text-slate-500 dark:text-gray-400 text-xs font-mono">
							{sale.id}
						</span>
					</DetailRow>

					{canPrice && (
						<DetailRow label="Recibo">
							{sale.receipt_url ? (
								<a
									href={sale.receipt_url}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors text-sm"
								>
									Ver recibo
									<ExternalLink size={13} />
								</a>
							) : (
								<span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
									Não gerado
								</span>
							)}
						</DetailRow>
					)}
				</div>
			</div>
		</div>
	);
}

function DetailRow({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-start justify-between py-2 border-b border-slate-100 dark:border-gray-800/50 last:border-0">
			<span className="text-sm text-slate-500 dark:text-gray-400 shrink-0">
				{label}
			</span>
			<div className="text-right text-sm">{children}</div>
		</div>
	);
}
