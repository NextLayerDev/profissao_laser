'use client';

import { Loader2, Lock, User } from 'lucide-react';
import { toast } from 'sonner';
import { usePurchase } from '@/hooks/use-purchase';
import { getCurrentUser } from '@/lib/auth';

interface CheckoutConfirmButtonProps {
	productId: string;
	companyName?: string;
}

export function CheckoutConfirmButton({
	productId,
	companyName,
}: CheckoutConfirmButtonProps) {
	const { mutate: purchase, isPending } = usePurchase();
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

	return (
		<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl border border-slate-200 dark:border-gray-800 p-6">
			<h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
				Finalizar compra
			</h3>
			<p className="text-sm text-slate-500 dark:text-gray-400 mb-5">
				Voce sera redirecionado para o pagamento seguro
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
				onClick={handlePurchase}
				disabled={isPending}
				className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors cursor-pointer text-base"
			>
				{isPending ? (
					<>
						<Loader2 className="w-5 h-5 animate-spin" />
						Processando...
					</>
				) : (
					<>
						<Lock className="w-4 h-4" />
						Finalizar compra
					</>
				)}
			</button>

			<p className="text-center text-xs text-slate-400 dark:text-gray-500 mt-3">
				Pagamento processado com seguranca via Stripe
			</p>
		</div>
	);
}
