'use client';

import { isAxiosError } from 'axios';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRefundSubscription } from '@/hooks/use-sales';
import { toTitleCase } from '@/utils/title-case';

interface Props {
	subscriptionId: string;
	productName: string;
	customerName: string;
	customerEmail: string;
	amountLabel: string;
	isOpen: boolean;
	onClose: () => void;
}

function messageForError(err: unknown): string {
	if (!isAxiosError(err)) return 'Erro ao processar reembolso';
	const status = err.response?.status;
	const apiMessage = (err.response?.data as { message?: string } | undefined)
		?.message;

	if (status === 404) return 'Assinatura não encontrada';
	if (status === 400 || status === 422) {
		if (apiMessage?.includes('window'))
			return 'Fora do prazo de 7 dias para reembolso';
		if (apiMessage?.includes('already'))
			return 'Assinatura já reembolsada ou cancelada';
		return apiMessage ?? 'Assinatura não pode ser reembolsada';
	}
	if (status === 500 && apiMessage) return apiMessage;
	return 'Erro ao processar reembolso';
}

export function RefundSubscriptionModal({
	subscriptionId,
	productName,
	customerName,
	customerEmail,
	amountLabel,
	isOpen,
	onClose,
}: Props) {
	const { mutate, isPending } = useRefundSubscription();

	if (!isOpen) return null;

	const handleConfirm = () => {
		mutate(subscriptionId, {
			onSuccess: () => {
				toast.success('Reembolso processado e assinatura cancelada');
				onClose();
			},
			onError: (err) => {
				toast.error(messageForError(err));
			},
		});
	};

	return (
		<div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm">
			<div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md mx-4 p-6 shadow-xl">
				<div className="flex items-center justify-between mb-5">
					<div className="flex items-center gap-2">
						<AlertTriangle size={18} className="text-amber-500" />
						<h2 className="text-base font-semibold text-slate-900 dark:text-white">
							Reembolsar assinatura
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						disabled={isPending}
						className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50"
					>
						<X size={18} />
					</button>
				</div>

				<p className="text-slate-600 dark:text-gray-300 text-sm mb-4">
					O valor será reembolsado integralmente e a assinatura será{' '}
					<span className="font-medium text-slate-900 dark:text-white">
						cancelada imediatamente
					</span>
					. Esta ação não pode ser desfeita.
				</p>

				<div className="space-y-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0d0d0f] p-4 text-sm">
					<Row label="Plano">
						<span className="text-slate-900 dark:text-white">
							{productName}
						</span>
					</Row>
					<Row label="Cliente">
						<span className="text-slate-900 dark:text-white">
							{toTitleCase(customerName)}
						</span>
					</Row>
					<Row label="E-mail">
						<span className="text-slate-600 dark:text-gray-300">
							{customerEmail}
						</span>
					</Row>
					<Row label="Valor">
						<span className="font-semibold text-slate-900 dark:text-white tabular-nums">
							{amountLabel}
						</span>
					</Row>
				</div>

				<div className="flex justify-end gap-3 mt-6">
					<button
						type="button"
						onClick={onClose}
						disabled={isPending}
						className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 text-slate-700 dark:text-white"
					>
						Voltar
					</button>
					<button
						type="button"
						onClick={handleConfirm}
						disabled={isPending}
						className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
					>
						{isPending && <Loader2 size={14} className="animate-spin" />}
						{isPending ? 'Processando...' : 'Confirmar reembolso'}
					</button>
				</div>
			</div>
		</div>
	);
}

function Row({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-center justify-between gap-4">
			<span className="text-slate-500 dark:text-gray-400">{label}</span>
			<div className="text-right">{children}</div>
		</div>
	);
}
