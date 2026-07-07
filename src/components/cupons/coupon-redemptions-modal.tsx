'use client';

import { Loader2, Users, X } from 'lucide-react';
import { useCouponRedemptions } from '@/hooks/use-upvox-coupons';
import type {
	CouponListItem,
	CouponRedemptionStatus,
} from '@/types/upvox-coupons';

interface CouponRedemptionsModalProps {
	coupon: CouponListItem;
	onClose: () => void;
}

function fmtBRL(cents: number | null): string {
	if (cents == null) return '—';
	return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

const STATUS_META: Record<
	CouponRedemptionStatus,
	{ label: string; cls: string }
> = {
	completed: {
		label: 'Concluído',
		cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
	},
	pending: {
		label: 'Pendente',
		cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
	},
	expired: {
		label: 'Expirado',
		cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
	},
};

export function CouponRedemptionsModal({
	coupon,
	onClose,
}: CouponRedemptionsModalProps) {
	const { data: redemptions, isLoading } = useCouponRedemptions(coupon.id);

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

			<div className="relative bg-[#1a1a1d] border border-gray-800 rounded-2xl w-full max-w-2xl mx-4 p-6 shadow-2xl text-white max-h-[92vh] overflow-y-auto">
				<div className="flex items-start justify-between mb-5">
					<div>
						<h2 className="text-xl font-bold flex items-center gap-2">
							Resgates
							<code className="text-sm font-mono text-violet-400">
								{coupon.code}
							</code>
						</h2>
						<p className="text-sm text-gray-400 mt-1">
							{coupon.uses_completed} concluído
							{coupon.uses_completed === 1 ? '' : 's'}
							{coupon.uses_pending > 0 &&
								` · ${coupon.uses_pending} pendente${coupon.uses_pending === 1 ? '' : 's'}`}
							{' · '}
							{fmtBRL(coupon.total_discount_cents)} em descontos
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#252528]"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{isLoading ? (
					<div className="flex justify-center py-16">
						<Loader2 className="w-6 h-6 animate-spin text-violet-500" />
					</div>
				) : !redemptions || redemptions.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 text-center">
						<div className="w-12 h-12 rounded-xl bg-violet-500/10 grid place-items-center mb-3">
							<Users className="w-6 h-6 text-violet-500" />
						</div>
						<p className="text-gray-300 font-medium">Nenhum resgate ainda</p>
						<p className="text-gray-500 text-sm mt-1">
							Os resgates aparecem quando os clientes aplicam este cupom.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto -mx-2">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-gray-800">
									{[
										'Cliente',
										'Tipo',
										'Desconto',
										'Total',
										'Status',
										'Data',
									].map((h) => (
										<th
											key={h}
											className="text-left py-2.5 px-2 font-medium text-gray-500 whitespace-nowrap"
										>
											{h}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{redemptions.map((r) => {
									const st = STATUS_META[r.status];
									return (
										<tr
											key={r.id}
											className="border-b border-gray-800/50 hover:bg-white/[0.02]"
										>
											<td className="py-2.5 px-2 max-w-[220px]">
												<p className="text-gray-200 truncate">
													{r.customer_name ?? '—'}
												</p>
												{r.customer_email && (
													<p className="text-xs text-gray-500 truncate">
														{r.customer_email}
													</p>
												)}
											</td>
											<td className="py-2.5 px-2 text-gray-400">
												{r.kind === 'plan' ? 'Plano' : 'Voxxys'}
											</td>
											<td className="py-2.5 px-2 text-violet-400 font-medium whitespace-nowrap">
												{fmtBRL(r.discount_cents)}
											</td>
											<td className="py-2.5 px-2 text-gray-300 whitespace-nowrap">
												{fmtBRL(r.amount_total_cents)}
											</td>
											<td className="py-2.5 px-2">
												<span
													className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${st.cls}`}
												>
													{st.label}
												</span>
											</td>
											<td className="py-2.5 px-2 text-gray-500 whitespace-nowrap">
												{new Date(r.created_at).toLocaleDateString('pt-BR')}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
