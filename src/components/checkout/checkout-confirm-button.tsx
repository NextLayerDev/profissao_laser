'use client';

import {
	AlertTriangle,
	ArrowDownCircle,
	ArrowUpCircle,
	CheckCircle,
	Loader2,
	Lock,
	User,
	X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { usePurchase } from '@/hooks/use-purchase';
import {
	useDowngradeSubscription,
	useUpgradeSubscription,
} from '@/hooks/use-subscription';
import { getCurrentUser } from '@/lib/auth';
import type { OwnershipStatus } from '@/utils/ownership';

interface CheckoutConfirmButtonProps {
	productId: string;
	companyName?: string;
	ownershipStatus: OwnershipStatus;
	isLoadingOwnership?: boolean;
}

export function CheckoutConfirmButton({
	productId,
	companyName,
	ownershipStatus,
	isLoadingOwnership,
}: CheckoutConfirmButtonProps) {
	const { mutate: purchase, isPending } = usePurchase();
	const { mutate: upgrade, isPending: isUpgrading } = useUpgradeSubscription();
	const { mutate: downgrade, isPending: isDowngrading } =
		useDowngradeSubscription();
	const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);
	const user = getCurrentUser();

	function handlePurchase() {
		purchase(
			{
				productId,
				...(companyName ? { companyName } : {}),
			},
			{
				onError: () => {
					toast.error('Erro ao processar compra. Tente novamente.');
				},
			},
		);
	}

	function handleUpgrade() {
		upgrade(
			{ productId },
			{
				onSuccess: (data) => {
					toast.success(
						`Upgrade realizado! Plano alterado de ${data.previousPlan} para ${data.newPlan}.`,
					);
				},
				onError: () => {
					toast.error('Erro ao processar upgrade. Tente novamente.');
				},
			},
		);
	}

	function handleDowngrade() {
		downgrade(
			{ productId },
			{
				onSuccess: (data) => {
					toast.success(
						`Downgrade realizado. Plano alterado de ${data.previousPlan} para ${data.newPlan}.`,
					);
					setShowDowngradeConfirm(false);
				},
				onError: () => {
					toast.error('Erro ao processar downgrade. Tente novamente.');
					setShowDowngradeConfirm(false);
				},
			},
		);
	}

	const isBusy = isPending || isUpgrading || isDowngrading;
	const isDisabled =
		isBusy || ownershipStatus === 'owned' || !!isLoadingOwnership;

	function handleClick() {
		if (ownershipStatus === 'owned') return;
		if (ownershipStatus === 'upgrade') return handleUpgrade();
		if (ownershipStatus === 'downgrade') return setShowDowngradeConfirm(true);
		return handlePurchase();
	}

	function renderButton() {
		if (isLoadingOwnership) {
			return (
				<>
					<Loader2 className="w-5 h-5 animate-spin" />
					Verificando...
				</>
			);
		}
		if (ownershipStatus === 'owned') {
			return (
				<>
					<CheckCircle className="w-4 h-4" />
					Ja possui
				</>
			);
		}
		if (isBusy) {
			return (
				<>
					<Loader2 className="w-5 h-5 animate-spin" />
					Processando...
				</>
			);
		}
		if (ownershipStatus === 'upgrade') {
			return (
				<>
					<ArrowUpCircle className="w-4 h-4" />
					Fazer upgrade
				</>
			);
		}
		if (ownershipStatus === 'downgrade') {
			return (
				<>
					<ArrowDownCircle className="w-4 h-4" />
					Fazer downgrade
				</>
			);
		}
		return (
			<>
				<Lock className="w-4 h-4" />
				Finalizar compra
			</>
		);
	}

	const buttonClass =
		ownershipStatus === 'owned' || isLoadingOwnership
			? 'w-full flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold py-3.5 rounded-xl cursor-not-allowed text-base'
			: ownershipStatus === 'downgrade'
				? 'w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors cursor-pointer text-base'
				: 'w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors cursor-pointer text-base';

	const heading =
		ownershipStatus === 'upgrade'
			? 'Fazer upgrade'
			: ownershipStatus === 'downgrade'
				? 'Fazer downgrade'
				: 'Finalizar compra';

	const subtitle =
		ownershipStatus === 'upgrade'
			? 'Seu plano sera atualizado automaticamente'
			: ownershipStatus === 'downgrade'
				? 'Seu plano sera ajustado automaticamente'
				: 'Voce sera redirecionado para o pagamento seguro';

	return (
		<>
			<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl border border-slate-200 dark:border-gray-800 p-6">
				<h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
					{heading}
				</h3>
				<p className="text-sm text-slate-500 dark:text-gray-400 mb-5">
					{subtitle}
				</p>

				{/* Usuario logado */}
				{user && (
					<div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 rounded-xl px-4 py-3 mb-5">
						<div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center">
							<User className="w-4 h-4 text-white" />
						</div>
						<div>
							<p className="text-sm font-medium text-slate-900 dark:text-white">
								{user.name ?? user.email ?? 'Usuario'}
							</p>
							{user.email && (
								<p className="text-xs text-slate-500 dark:text-gray-400">
									{user.email}
								</p>
							)}
						</div>
					</div>
				)}

				<button
					type="button"
					onClick={handleClick}
					disabled={isDisabled}
					className={buttonClass}
				>
					{renderButton()}
				</button>

				{ownershipStatus === 'owned' ? (
					<p className="text-center text-xs text-slate-400 dark:text-gray-500 mt-3">
						Voce ja possui este produto. Acesse sua area de alunos.
					</p>
				) : ownershipStatus === 'upgrade' || ownershipStatus === 'downgrade' ? (
					<p className="text-center text-xs text-slate-400 dark:text-gray-500 mt-3">
						A alteracao sera aplicada imediatamente na sua assinatura
					</p>
				) : (
					<p className="text-center text-xs text-slate-400 dark:text-gray-500 mt-3">
						Pagamento processado com seguranca via Stripe
					</p>
				)}
			</div>

			{/* Downgrade confirmation dialog */}
			{showDowngradeConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm">
					<div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md mx-4 p-6 shadow-xl">
						<div className="flex items-center justify-between mb-5">
							<div className="flex items-center gap-2 text-amber-500 dark:text-amber-400">
								<AlertTriangle size={18} />
								<h2 className="text-base font-semibold text-slate-900 dark:text-white">
									Confirmar downgrade
								</h2>
							</div>
							<button
								type="button"
								onClick={() => setShowDowngradeConfirm(false)}
								className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
							>
								<X size={18} />
							</button>
						</div>
						<p className="text-slate-600 dark:text-gray-300 text-sm mb-1">
							Tem certeza que deseja fazer downgrade do seu plano?
						</p>
						<p className="text-slate-500 dark:text-gray-500 text-sm mb-6">
							Voce podera perder acesso a recursos do plano atual. Esta acao
							pode ser revertida fazendo upgrade novamente.
						</p>
						<div className="flex justify-end gap-3">
							<button
								type="button"
								onClick={() => setShowDowngradeConfirm(false)}
								disabled={isDowngrading}
								className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 text-slate-700 dark:text-white cursor-pointer"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={handleDowngrade}
								disabled={isDowngrading}
								className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50 transition-colors cursor-pointer"
							>
								{isDowngrading ? (
									<>
										<Loader2 size={14} className="animate-spin" />
										Processando...
									</>
								) : (
									<>
										<ArrowDownCircle size={14} />
										Confirmar downgrade
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
