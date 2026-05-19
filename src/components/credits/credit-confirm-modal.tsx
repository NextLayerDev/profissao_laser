'use client';

import { Coins, Wallet, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ModalOverlay } from '@/components/ui/modal-overlay';

export type CreditModalVariant = 'confirm' | 'insufficient' | 'daily-limit';

interface CreditConfirmModalProps {
	variant: CreditModalVariant;
	cost: number;
	balance: number;
	/** somente para variant='daily-limit' */
	canUseCredits?: boolean;
	pending?: boolean;
	onConfirm: () => void;
	onClose: () => void;
}

export function CreditConfirmModal({
	variant,
	cost,
	balance,
	canUseCredits = true,
	pending = false,
	onConfirm,
	onClose,
}: CreditConfirmModalProps) {
	const router = useRouter();
	const goBuy = () => {
		onClose();
		router.push('/course/voxes');
	};

	const isInsufficient =
		variant === 'insufficient' || (variant === 'daily-limit' && !canUseCredits);

	return (
		<ModalOverlay onClose={onClose}>
			<div className="p-6">
				<div className="flex items-start justify-between mb-4">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
							{isInsufficient ? (
								<Wallet className="w-5 h-5 text-violet-500" />
							) : (
								<Coins className="w-5 h-5 text-violet-500" />
							)}
						</div>
						<h3 className="text-lg font-bold text-slate-900 dark:text-white">
							{isInsufficient
								? 'Saldo insuficiente'
								: variant === 'daily-limit'
									? 'Prévias grátis esgotadas'
									: 'Confirmar uso de voxes'}
						</h3>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<p className="text-sm text-slate-600 dark:text-gray-400 mb-6">
					{isInsufficient ? (
						<>
							Esta ação custa{' '}
							<strong className="text-slate-900 dark:text-white">
								{cost} {cost === 1 ? 'vox' : 'voxes'}
							</strong>{' '}
							e você tem apenas{' '}
							<strong className="text-slate-900 dark:text-white">
								{balance}
							</strong>
							. Compre voxes para continuar.
						</>
					) : (
						<>
							{variant === 'daily-limit'
								? 'Suas prévias grátis de hoje acabaram. '
								: ''}
							Esta ação custa{' '}
							<strong className="text-slate-900 dark:text-white">
								{cost} {cost === 1 ? 'vox' : 'voxes'}
							</strong>
							. Seu saldo:{' '}
							<strong className="text-slate-900 dark:text-white">
								{balance} {balance === 1 ? 'vox' : 'voxes'}
							</strong>
							. Deseja continuar?
						</>
					)}
				</p>

				<div className="flex gap-3">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
					>
						Cancelar
					</button>
					{isInsufficient ? (
						<button
							type="button"
							onClick={goBuy}
							className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors"
						>
							Comprar voxes
						</button>
					) : (
						<button
							type="button"
							onClick={onConfirm}
							disabled={pending}
							className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-60"
						>
							{pending
								? 'Processando...'
								: `Usar ${cost} ${cost === 1 ? 'vox' : 'voxes'}`}
						</button>
					)}
				</div>
			</div>
		</ModalOverlay>
	);
}
