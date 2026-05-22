'use client';

import { Coins, Sparkles, Wallet, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ModalOverlay } from '@/components/ui/modal-overlay';

export type CreditModalVariant =
	| 'confirm'
	| 'insufficient'
	| 'free-tier-exhausted'
	/** @deprecated mantido para compatibilidade — use 'free-tier-exhausted' */
	| 'daily-limit';

interface CreditConfirmModalProps {
	variant: CreditModalVariant;
	cost: number;
	balance: number;
	/** somente para variant='daily-limit' */
	canUseCredits?: boolean;
	pending?: boolean;
	/** info extra do tier grátis: limite, usados, período, próxima janela */
	freeTier?: {
		limit: number;
		used: number;
		period: 'daily' | 'weekly';
		resetsAt: string;
	};
	onConfirm: () => void;
	onClose: () => void;
}

function formatResetTime(resetsAt: string, period: 'daily' | 'weekly'): string {
	if (!resetsAt) return '';
	try {
		const d = new Date(resetsAt);
		if (period === 'daily') {
			return `amanhã às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
		}
		// weekly → mostra dia da semana + data curta
		const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' });
		const short = d.toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
		});
		return `${weekday} (${short})`;
	} catch {
		return resetsAt;
	}
}

export function CreditConfirmModal({
	variant,
	cost,
	balance,
	canUseCredits = true,
	pending = false,
	freeTier,
	onConfirm,
	onClose,
}: CreditConfirmModalProps) {
	const router = useRouter();
	const goBuy = () => {
		onClose();
		router.push('/course/voxes');
	};

	const isFreeTierExhausted =
		variant === 'free-tier-exhausted' ||
		(variant === 'daily-limit' && !canUseCredits);
	const isInsufficient =
		variant === 'insufficient' ||
		isFreeTierExhausted ||
		(variant === 'daily-limit' && !canUseCredits);

	// ── Free-tier exhausted: CTA é "Comprar voxes", sem opção de confirmar ──
	if (isFreeTierExhausted) {
		const periodLabel = freeTier?.period === 'daily' ? 'hoje' : 'esta semana';
		const periodLabelDe = freeTier?.period === 'daily' ? 'dia' : 'semana';
		const resetText = freeTier
			? formatResetTime(freeTier.resetsAt, freeTier.period)
			: '';

		return (
			<ModalOverlay onClose={onClose}>
				<div className="p-6">
					<div className="flex items-start justify-between mb-4">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500/25 to-fuchsia-500/25 flex items-center justify-center">
								<Sparkles className="w-5 h-5 text-violet-500" />
							</div>
							<h3 className="text-lg font-bold text-slate-900 dark:text-white">
								Limite gratuito atingido
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

					<p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
						Você usou{' '}
						<strong className="text-slate-900 dark:text-white">
							{freeTier?.used ?? 0} de {freeTier?.limit ?? 0}
						</strong>{' '}
						usos gratuitos {periodLabel}. O limite renova{' '}
						{resetText ? (
							<>
								<strong className="text-slate-900 dark:text-white">
									{resetText}
								</strong>
								.{' '}
							</>
						) : (
							`no próximo ${periodLabelDe}. `
						)}
						Compre voxes para continuar usando sem limite.
					</p>

					<div className="rounded-xl border border-violet-200 dark:border-violet-800/40 bg-violet-50 dark:bg-violet-950/20 p-3 mb-6">
						<div className="flex items-center gap-2 text-sm text-violet-700 dark:text-violet-300">
							<Coins className="w-4 h-4" />
							<span>Com voxes você não tem limite — só o custo por uso.</span>
						</div>
					</div>

					<div className="flex gap-3">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
						>
							Mais tarde
						</button>
						<button
							type="button"
							onClick={goBuy}
							className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors"
						>
							Comprar voxes
						</button>
					</div>
				</div>
			</ModalOverlay>
		);
	}

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
							{isInsufficient ? 'Saldo insuficiente' : 'Confirmar uso de voxes'}
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
