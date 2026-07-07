'use client';

import { Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { CouponCodeInput } from '@/components/checkout/coupon-code-input';
import { VoxxysIcon } from '@/components/ui/voxxys-icon';
import { usePurchaseVoxes, type VoxPackage } from '@/modules/voxes';

interface VoxPurchaseModalProps {
	pkg: VoxPackage;
	onClose: () => void;
}

export function VoxPurchaseModal({ pkg, onClose }: VoxPurchaseModalProps) {
	const purchase = usePurchaseVoxes();
	const [couponCode, setCouponCode] = useState<string | null>(null);

	function confirm() {
		purchase.mutate(
			{ package_id: pkg.id, coupon_code: couponCode ?? undefined },
			{
				onError: () =>
					toast.error('Erro ao iniciar o pagamento. Tente novamente.'),
			},
		);
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<button
				type="button"
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
				onKeyDown={(e) => {
					if (e.key === 'Escape') onClose();
				}}
			>
				<span className="sr-only">Fechar modal</span>
			</button>

			<div className="relative bg-[#1a1a1d] border border-gray-800 rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl text-white">
				<div className="flex items-center justify-between mb-5">
					<h2 className="text-xl font-bold">Comprar voxxys</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#252528]"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Resumo do pacote */}
				<div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between">
					<div>
						<p className="font-semibold">{pkg.name}</p>
						<p className="mt-1 flex items-center gap-1.5 text-violet-400 font-bold">
							<VoxxysIcon className="w-4 h-4" />
							{pkg.vox_amount}
							<span className="text-sm font-medium text-gray-400">voxxys</span>
						</p>
					</div>
					<p className="text-lg font-bold tabular-nums">
						R$ {(pkg.price_cents / 100).toFixed(2).replace('.', ',')}
					</p>
				</div>

				{/* Cupom */}
				<CouponCodeInput
					context="vox"
					voxPackageId={pkg.id}
					onApplied={setCouponCode}
					className="mt-4"
				/>

				<div className="flex items-center gap-3 mt-6">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 px-5 py-3 rounded-xl font-medium text-sm bg-[#252528] hover:bg-[#2a2a2d] transition-colors"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={confirm}
						disabled={purchase.isPending || !pkg.stripe_price_id}
						className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm bg-violet-600 hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{purchase.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
						Ir para o pagamento
					</button>
				</div>
			</div>
		</div>
	);
}
