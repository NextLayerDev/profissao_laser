'use client';

import { AlertTriangle, Loader2, X } from 'lucide-react';

interface CancelSubscriptionModalProps {
	isOpen: boolean;
	onClose: () => void;
	periodEnd: string;
	onConfirm: () => void;
	isPending: boolean;
}

export function CancelSubscriptionModal({
	isOpen,
	onClose,
	periodEnd,
	onConfirm,
	isPending,
}: CancelSubscriptionModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm">
			<div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md mx-4 p-6 shadow-xl">
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

				<p className="text-slate-600 dark:text-gray-300 text-sm mb-3">
					Tem certeza? Você continuará com acesso até{' '}
					<span className="font-semibold text-slate-900 dark:text-white">
						{periodEnd}
					</span>
					. Após isso, sua conta será desativada.
				</p>

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
						onClick={onConfirm}
						disabled={isPending}
						className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
					>
						{isPending ? (
							<Loader2 size={14} className="animate-spin" />
						) : (
							<AlertTriangle size={14} />
						)}
						{isPending ? 'Cancelando...' : 'Cancelar assinatura'}
					</button>
				</div>
			</div>
		</div>
	);
}
