'use client';

import { CreditCard, Loader2, X } from 'lucide-react';
import type { Product } from '@/types/products';
import { formatCurrency } from '@/utils/format-currency';

interface ConfirmAddonModalProps {
	addon: Product | null;
	onClose: () => void;
	onConfirm: () => void;
	isPending: boolean;
}

/**
 * Complemento é cobrança NOVA e recorrente, separada do plano: antes um clique
 * em "Adicionar" já contratava, sem dizer o valor nem que gerava cobrança.
 */
export function ConfirmAddonModal({
	addon,
	onClose,
	onConfirm,
	isPending,
}: ConfirmAddonModalProps) {
	if (!addon) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm">
			<div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md mx-4 p-6 shadow-xl">
				<div className="flex items-center justify-between mb-5">
					<div className="flex items-center gap-2">
						<CreditCard size={18} className="text-violet-500" />
						<h2 className="text-base font-semibold text-slate-900 dark:text-white">
							Adicionar complemento
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						disabled={isPending}
						aria-label="Fechar"
						className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50"
					>
						<X size={18} />
					</button>
				</div>

				<p className="text-slate-600 dark:text-gray-300 text-sm">
					<span className="font-semibold text-slate-900 dark:text-white">
						{addon.name}
					</span>{' '}
					por{' '}
					<span className="font-semibold text-slate-900 dark:text-white">
						{formatCurrency(addon.price, 'BRL')}
					</span>
					, em cobrança recorrente.
				</p>
				<ul className="mt-3 space-y-1.5 text-sm text-slate-600 dark:text-gray-300 list-disc pl-5">
					<li>A cobrança é feita no seu cartão de crédito.</li>
					<li>
						É uma cobrança separada do seu plano: se ela falhar, seu plano
						continua ativo.
					</li>
					<li>Você pode remover quando quiser, e ele não renova mais.</li>
				</ul>

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
						className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50"
					>
						{isPending ? (
							<Loader2 size={14} className="animate-spin" />
						) : (
							<CreditCard size={14} />
						)}
						{isPending ? 'Cobrando...' : 'Confirmar e pagar'}
					</button>
				</div>
			</div>
		</div>
	);
}
