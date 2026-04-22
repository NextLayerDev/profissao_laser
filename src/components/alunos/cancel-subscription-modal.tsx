'use client';

import { isAxiosError } from 'axios';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useRecurringSales } from '@/hooks/use-sales';
import { useCancelSubscription } from '@/hooks/use-subscription';
import type { Customer } from '@/types/customer';
import type { RecurringSubscription } from '@/types/sales';
import { formatCurrency } from '@/utils/format-currency';
import { formatDate } from '@/utils/formatDate';

interface Props {
	customer: Customer | null;
	isOpen: boolean;
	onClose: () => void;
}

const INTERVAL_LABELS: Record<string, string> = {
	day: 'dia',
	week: 'semana',
	month: 'mês',
	year: 'ano',
};

function messageForError(err: unknown): string {
	if (!isAxiosError(err)) return 'Erro ao cancelar assinatura';
	const status = err.response?.status;
	const apiMessage = (err.response?.data as { message?: string } | undefined)
		?.message;

	if (status === 404) return 'Assinatura não encontrada';
	if (status === 400 && apiMessage) {
		if (apiMessage.includes('does not belong to this customer'))
			return 'Assinatura não pertence a este cliente';
		if (apiMessage.includes('already cancelled'))
			return 'Assinatura já foi cancelada';
		return apiMessage;
	}
	if (status === 401) return 'Sessão expirada. Faça login novamente';
	return apiMessage ?? 'Erro ao cancelar assinatura';
}

export function CancelSubscriptionModal({ customer, isOpen, onClose }: Props) {
	const { subscriptions, isLoading } = useRecurringSales(
		isOpen ? { status: 'all', limit: 100 } : {},
	);
	const { mutate, isPending } = useCancelSubscription();
	const [selectedId, setSelectedId] = useState<string | null>(null);

	const customerSubs = useMemo(() => {
		if (!customer) return [] as RecurringSubscription[];
		const email = customer.email.toLowerCase();
		return subscriptions.filter(
			(s) => s.customer.email.toLowerCase() === email,
		);
	}, [subscriptions, customer]);

	useEffect(() => {
		if (!isOpen) {
			setSelectedId(null);
			return;
		}
		if (selectedId && !customerSubs.some((s) => s.id === selectedId)) {
			setSelectedId(null);
		}
		if (!selectedId) {
			const firstActive = customerSubs.find((s) => !s.cancelAtPeriodEnd);
			if (firstActive) setSelectedId(firstActive.id);
		}
	}, [isOpen, customerSubs, selectedId]);

	if (!isOpen || !customer) return null;

	const selected = customerSubs.find((s) => s.id === selectedId) ?? null;

	const handleConfirm = () => {
		if (!selected) return;
		mutate(
			{
				email: customer.email,
				subscriptionId: selected.id,
			},
			{
				onSuccess: (data) => {
					toast.success(
						`Assinatura cancelada. Acesso válido até ${formatDate(
							data.currentPeriodEnd,
						)}`,
					);
					onClose();
				},
				onError: (err) => {
					toast.error(messageForError(err));
				},
			},
		);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm">
			<div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md mx-4 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between mb-5">
					<div className="flex items-center gap-2">
						<AlertTriangle size={18} className="text-amber-500" />
						<h2 className="text-base font-semibold text-slate-900 dark:text-white">
							Cancelar assinatura
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

				<p className="text-slate-900 dark:text-white font-semibold text-sm">
					{customer.name}
				</p>
				<p className="text-slate-500 dark:text-gray-500 text-xs mb-4">
					{customer.email}
				</p>

				<p className="text-xs font-medium text-slate-600 dark:text-gray-400 mb-2">
					Selecione a assinatura
				</p>

				{isLoading ? (
					<div className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-500 py-6 justify-center">
						<Loader2 size={14} className="animate-spin" />
						Carregando assinaturas...
					</div>
				) : customerSubs.length === 0 ? (
					<div className="text-sm text-slate-500 dark:text-gray-500 py-6 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-lg">
						Nenhuma assinatura encontrada para este aluno.
					</div>
				) : (
					<div className="space-y-2 max-h-64 overflow-y-auto pr-1">
						{customerSubs.map((sub) => {
							const isSelected = selectedId === sub.id;
							const isCancelling = sub.cancelAtPeriodEnd;
							const intervalLabel =
								sub.intervalCount === 1
									? `por ${INTERVAL_LABELS[sub.interval] ?? sub.interval}`
									: `a cada ${sub.intervalCount} ${INTERVAL_LABELS[sub.interval] ?? sub.interval}s`;
							return (
								<button
									key={sub.id}
									type="button"
									onClick={() => !isCancelling && setSelectedId(sub.id)}
									disabled={isCancelling}
									className={`w-full flex items-start justify-between gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
										isCancelling
											? 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/2 opacity-60 cursor-not-allowed'
											: isSelected
												? 'border-red-500 bg-red-50 dark:bg-red-500/10'
												: 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
									}`}
								>
									<div className="flex flex-col min-w-0">
										<span className="text-sm font-medium text-slate-900 dark:text-white truncate">
											{sub.product}
										</span>
										<span className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
											{formatCurrency(sub.amount, sub.currency.toUpperCase())}{' '}
											{intervalLabel}
										</span>
										<span className="text-xs text-slate-400 dark:text-gray-500 mt-0.5 font-mono truncate">
											{sub.id}
										</span>
									</div>
									<div className="text-right shrink-0">
										{isCancelling ? (
											<span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
												Cancela em {formatDate(sub.nextChargeAt)}
											</span>
										) : (
											<span className="text-xs text-slate-500 dark:text-gray-400">
												Renova em
												<br />
												{formatDate(sub.nextChargeAt)}
											</span>
										)}
									</div>
								</button>
							);
						})}
					</div>
				)}

				{selected && (
					<p className="text-xs text-slate-500 dark:text-gray-400 mt-4">
						O cancelamento ocorre no fim do período atual — o aluno mantém
						acesso até <strong>{formatDate(selected.nextChargeAt)}</strong>.
					</p>
				)}

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
						disabled={isPending || !selected}
						className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
					>
						{isPending && <Loader2 size={14} className="animate-spin" />}
						{isPending ? 'Cancelando...' : 'Confirmar cancelamento'}
					</button>
				</div>
			</div>
		</div>
	);
}
