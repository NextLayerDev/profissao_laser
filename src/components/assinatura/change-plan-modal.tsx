'use client';

import { ArrowDown, ArrowUp, Loader2, X } from 'lucide-react';

interface ChangePlanModalProps {
	isOpen: boolean;
	onClose: () => void;
	type: 'upgrade' | 'downgrade';
	productName: string;
	price: string;
	onConfirm: () => void;
	isPending: boolean;
}

export function ChangePlanModal({
	isOpen,
	onClose,
	type,
	productName,
	price,
	onConfirm,
	isPending,
}: ChangePlanModalProps) {
	if (!isOpen) return null;

	const isUpgrade = type === 'upgrade';

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm">
			<div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md mx-4 p-6 shadow-xl">
				<div className="flex items-center justify-between mb-5">
					<div className="flex items-center gap-2">
						{isUpgrade ? (
							<ArrowUp size={18} className="text-green-500" />
						) : (
							<ArrowDown size={18} className="text-amber-500" />
						)}
						<h2 className="text-base font-semibold text-slate-900 dark:text-white">
							{isUpgrade ? 'Upgrade de plano' : 'Downgrade de plano'}
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

				<p className="text-slate-600 dark:text-gray-300 text-sm mb-1">
					Você será migrado para{' '}
					<span className="font-semibold text-slate-900 dark:text-white">
						{productName}
					</span>{' '}
					por{' '}
					<span className="font-semibold text-slate-900 dark:text-white">
						{price}
					</span>
					.
				</p>
				{!isUpgrade && (
					<p className="text-amber-600 dark:text-amber-400 text-xs mt-2">
						Ao fazer downgrade, alguns recursos do seu plano atual podem deixar
						de estar disponíveis.
					</p>
				)}

				<div className="flex justify-end gap-3 mt-6">
					<button
						type="button"
						onClick={onClose}
						disabled={isPending}
						className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 text-slate-700 dark:text-white"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={isPending}
						className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white transition-colors disabled:opacity-50 ${
							isUpgrade
								? 'bg-green-600 hover:bg-green-500'
								: 'bg-amber-600 hover:bg-amber-500'
						}`}
					>
						{isPending ? (
							<Loader2 size={14} className="animate-spin" />
						) : isUpgrade ? (
							<ArrowUp size={14} />
						) : (
							<ArrowDown size={14} />
						)}
						{isPending
							? 'Alterando...'
							: isUpgrade
								? 'Confirmar upgrade'
								: 'Confirmar downgrade'}
					</button>
				</div>
			</div>
		</div>
	);
}
