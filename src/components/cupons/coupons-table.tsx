'use client';

import { Loader2, Pencil, Power, Ticket, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	useCoupons,
	useDeleteCoupon,
	useUpdateCoupon,
} from '@/hooks/use-upvox-coupons';
import type { CouponListItem } from '@/types/upvox-coupons';
import { CouponRedemptionsModal } from './coupon-redemptions-modal';
import { CreateCouponModal } from './create-coupon-modal';

function fmtBRL(cents: number): string {
	return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

function discountLabel(c: CouponListItem): string {
	return c.discount_type === 'percent'
		? `${c.percent_off}%`
		: fmtBRL(c.amount_off_cents ?? 0);
}

const APPLIES_LABEL: Record<string, string> = {
	all: 'Tudo',
	plans: 'Planos',
	voxes: 'Voxxys',
};

function durationLabel(c: CouponListItem): string {
	if (c.duration === 'once') return '1ª cobrança';
	if (c.duration === 'forever') return 'Sempre';
	return `${c.duration_in_months} ${c.duration_in_months === 1 ? 'mês' : 'meses'}`;
}

type StatusKind = 'active' | 'inactive' | 'scheduled' | 'expired' | 'exhausted';

function statusOf(c: CouponListItem): StatusKind {
	if (!c.active) return 'inactive';
	const now = Date.now();
	if (c.expires_at && new Date(c.expires_at).getTime() <= now) return 'expired';
	if (c.starts_at && new Date(c.starts_at).getTime() > now) return 'scheduled';
	if (c.max_uses != null && c.uses_completed + c.uses_pending >= c.max_uses)
		return 'exhausted';
	return 'active';
}

const STATUS_META: Record<StatusKind, { label: string; cls: string }> = {
	active: {
		label: 'Ativo',
		cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
	},
	inactive: {
		label: 'Inativo',
		cls: 'bg-red-500/10 text-red-500 border-red-500/20',
	},
	scheduled: {
		label: 'Agendado',
		cls: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
	},
	expired: {
		label: 'Expirado',
		cls: 'bg-red-500/10 text-red-500 border-red-500/20',
	},
	exhausted: {
		label: 'Esgotado',
		cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
	},
};

export function CouponsTable() {
	const { data: coupons, isLoading } = useCoupons();
	const toggle = useUpdateCoupon();
	const remove = useDeleteCoupon();
	const [editing, setEditing] = useState<CouponListItem | null>(null);
	const [redemptionsOf, setRedemptionsOf] = useState<CouponListItem | null>(
		null,
	);

	if (isLoading) {
		return (
			<div className="flex justify-center py-16">
				<Loader2 className="w-6 h-6 animate-spin text-violet-500" />
			</div>
		);
	}

	if (!coupons || coupons.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center">
				<div className="w-12 h-12 rounded-xl bg-violet-500/10 grid place-items-center mb-3">
					<Ticket className="w-6 h-6 text-violet-500" />
				</div>
				<p className="text-slate-600 dark:text-gray-300 font-medium">
					Nenhum cupom ainda
				</p>
				<p className="text-slate-500 dark:text-gray-500 text-sm mt-1">
					Crie um cupom para oferecer descontos no checkout.
				</p>
			</div>
		);
	}

	return (
		<>
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-slate-200 dark:border-gray-800">
							{[
								'Código',
								'Desconto',
								'Escopo',
								'Duração',
								'Usos',
								'Validade',
								'Status',
								'',
							].map((h) => (
								<th
									key={h}
									className="text-left py-3 px-4 font-medium text-slate-400 dark:text-gray-600 whitespace-nowrap"
								>
									{h}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{coupons.map((c) => {
							const st = STATUS_META[statusOf(c)];
							return (
								<tr
									key={c.id}
									className="border-b border-slate-100 dark:border-gray-800/50 hover:bg-slate-50 dark:hover:bg-[#1a1a1d]/50 transition-colors"
								>
									<td className="py-3 px-4">
										<code className="text-xs font-mono font-semibold text-slate-800 dark:text-gray-200">
											{c.code}
										</code>
									</td>
									<td className="py-3 px-4 font-semibold text-violet-600 dark:text-violet-400 whitespace-nowrap">
										{discountLabel(c)}
									</td>
									<td className="py-3 px-4 text-slate-600 dark:text-gray-400">
										{APPLIES_LABEL[c.applies_to]}
									</td>
									<td className="py-3 px-4 text-slate-600 dark:text-gray-400 whitespace-nowrap">
										{durationLabel(c)}
									</td>
									<td className="py-3 px-4 text-slate-600 dark:text-gray-400 whitespace-nowrap tabular-nums">
										{c.uses_completed}
										{c.max_uses != null ? `/${c.max_uses}` : '/∞'}
										{c.uses_pending > 0 && (
											<span className="text-amber-500 text-xs ml-1">
												(+{c.uses_pending})
											</span>
										)}
									</td>
									<td className="py-3 px-4 text-slate-500 dark:text-gray-500 whitespace-nowrap">
										{c.expires_at
											? new Date(c.expires_at).toLocaleDateString('pt-BR')
											: '—'}
									</td>
									<td className="py-3 px-4">
										<span
											className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${st.cls}`}
										>
											{st.label}
										</span>
									</td>
									<td className="py-3 px-4">
										<div className="flex items-center justify-end gap-1">
											<button
												type="button"
												title="Resgates"
												onClick={() => setRedemptionsOf(c)}
												className="p-2 rounded-lg text-slate-400 hover:text-violet-500 hover:bg-slate-100 dark:hover:bg-white/5"
											>
												<Users className="w-4 h-4" />
											</button>
											<button
												type="button"
												title="Editar"
												onClick={() => setEditing(c)}
												className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
											>
												<Pencil className="w-4 h-4" />
											</button>
											<button
												type="button"
												title={c.active ? 'Desativar' : 'Ativar'}
												onClick={() =>
													toggle.mutate(
														{ id: c.id, payload: { active: !c.active } },
														{
															onSuccess: () =>
																toast.success(
																	c.active
																		? 'Cupom desativado'
																		: 'Cupom ativado',
																),
															onError: () => toast.error('Erro ao atualizar'),
														},
													)
												}
												className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 ${c.active ? 'text-emerald-500' : 'text-slate-400'}`}
											>
												<Power className="w-4 h-4" />
											</button>
											<button
												type="button"
												title="Excluir"
												onClick={() => {
													if (!window.confirm(`Excluir o cupom ${c.code}?`))
														return;
													remove.mutate(c.id, {
														onSuccess: () => toast.success('Cupom excluído'),
														onError: () => toast.error('Erro ao excluir'),
													});
												}}
												className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-white/5"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{editing && (
				<CreateCouponModal editing={editing} onClose={() => setEditing(null)} />
			)}
			{redemptionsOf && (
				<CouponRedemptionsModal
					coupon={redemptionsOf}
					onClose={() => setRedemptionsOf(null)}
				/>
			)}
		</>
	);
}
