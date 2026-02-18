'use client';

import { Loader2, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	useCreateCoupon,
	useDeleteCoupon,
	useProductCoupons,
} from '@/hooks/use-coupons';
import type { CreateCouponPayload } from '@/services/coupons';
import type { CuponsSectionProps } from '@/types/components/cupons-section';
import { DURATION_LABELS } from '@/utils/constants/coupon';

export function CuponsSection({ product }: CuponsSectionProps) {
	const { data: coupons = [], isLoading } = useProductCoupons(product.id);
	const createMutation = useCreateCoupon(product.id);
	const deleteMutation = useDeleteCoupon(product.id);

	const [showModal, setShowModal] = useState(false);
	const [discountMode, setDiscountMode] = useState<'percent' | 'amount'>(
		'percent',
	);
	const [formData, setFormData] = useState({
		duration: 'once' as 'once' | 'repeating' | 'forever',
		percent_off: '',
		amount_off: '',
		duration_in_months: '',
		max_redemptions: '',
		redeem_by: '',
	});

	const resetForm = () => {
		setDiscountMode('percent');
		setFormData({
			duration: 'once',
			percent_off: '',
			amount_off: '',
			duration_in_months: '',
			max_redemptions: '',
			redeem_by: '',
		});
	};

	const handleSave = async () => {
		if (discountMode === 'percent' && !formData.percent_off) {
			toast.error('Informe o percentual de desconto');
			return;
		}
		if (discountMode === 'amount' && !formData.amount_off) {
			toast.error('Informe o valor do desconto');
			return;
		}
		if (formData.duration === 'repeating' && !formData.duration_in_months) {
			toast.error('Informe a duração em meses para cupons recorrentes');
			return;
		}

		const payload: CreateCouponPayload = {
			product_id: product.id,
			duration: formData.duration,
			...(discountMode === 'percent'
				? { percent_off: parseFloat(formData.percent_off) }
				: { amount_off: parseInt(formData.amount_off, 10) }),
			...(formData.duration === 'repeating' && formData.duration_in_months
				? { duration_in_months: parseInt(formData.duration_in_months, 10) }
				: {}),
			...(formData.max_redemptions
				? { max_redemptions: parseInt(formData.max_redemptions, 10) }
				: {}),
			...(formData.redeem_by
				? { redeem_by: new Date(formData.redeem_by).toISOString() }
				: {}),
		};

		try {
			await createMutation.mutateAsync(payload);
			toast.success('Cupom criado com sucesso!');
			setShowModal(false);
			resetForm();
		} catch (error: unknown) {
			toast.error(
				error instanceof Error ? error.message : 'Erro ao criar cupom',
			);
		}
	};

	const handleDelete = async (couponId: string) => {
		if (!confirm('Tem certeza que deseja excluir este cupom?')) return;

		try {
			await deleteMutation.mutateAsync(couponId);
			toast.success('Cupom excluído com sucesso!');
		} catch (error: unknown) {
			toast.error(
				error instanceof Error ? error.message : 'Erro ao excluir cupom',
			);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
					Cupons
				</h2>
				<button
					type="button"
					onClick={() => {
						resetForm();
						setShowModal(true);
					}}
					className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-md"
				>
					<Plus className="h-5 w-5" />
					Criar cupom
				</button>
			</div>

			<div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
				<div className="p-4 border-b border-slate-200 dark:border-slate-700">
					<span className="text-sm text-slate-600 dark:text-slate-300">
						Total de {coupons.length} registros
					</span>
				</div>

				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-8 w-8 animate-spin text-purple-600" />
					</div>
				) : coupons.length === 0 ? (
					<div className="p-12 text-center">
						<p className="text-slate-500 dark:text-slate-400">
							Nenhum cupom cadastrado
						</p>
						<button
							type="button"
							onClick={() => {
								resetForm();
								setShowModal(true);
							}}
							className="mt-4 text-purple-600 dark:text-purple-400 font-medium hover:underline"
						>
							Criar primeiro cupom
						</button>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="bg-slate-50 dark:bg-slate-900">
									<th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
										Código
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
										Desconto
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
										Duração
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
										Limite de usos
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
										Expira em
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
										Ações
									</th>
								</tr>
							</thead>
							<tbody>
								{coupons.map((coupon) => (
									<tr
										key={coupon.id}
										className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
									>
										<td className="px-4 py-4 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
											{coupon.id}
										</td>
										<td className="px-4 py-4 text-slate-900 dark:text-slate-100">
											<span className="text-amber-600 dark:text-amber-400 font-semibold">
												{coupon.percent_off != null
													? `${coupon.percent_off}%`
													: coupon.amount_off != null
														? `${coupon.currency?.toUpperCase() ?? ''} ${(coupon.amount_off / 100).toFixed(2)}`
														: '-'}
											</span>
										</td>
										<td className="px-4 py-4 text-slate-600 dark:text-slate-300 text-sm">
											{DURATION_LABELS[coupon.duration] ?? coupon.duration}
											{coupon.duration === 'repeating' &&
											coupon.duration_in_months
												? ` (${coupon.duration_in_months} meses)`
												: ''}
										</td>
										<td className="px-4 py-4 text-slate-600 dark:text-slate-300 text-sm">
											{coupon.max_redemptions ?? 'Ilimitado'}
										</td>
										<td className="px-4 py-4 text-slate-600 dark:text-slate-300 text-sm">
											{coupon.redeem_by
												? new Date(coupon.redeem_by).toLocaleDateString('pt-BR')
												: 'Sem expiração'}
										</td>
										<td className="px-4 py-4">
											<button
												type="button"
												onClick={() => handleDelete(coupon.id)}
												className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
											>
												<Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Modal */}
			{showModal && (
				<div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/70 flex items-center justify-center z-50 p-4">
					<div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full">
						<div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
							<h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
								Criar cupom
							</h3>
							<button
								type="button"
								onClick={() => {
									setShowModal(false);
									resetForm();
								}}
								className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
							>
								<X className="h-5 w-5 text-slate-600 dark:text-slate-300" />
							</button>
						</div>

						<div className="p-6 space-y-5">
							{/* Duration */}
							<div>
								<label
									htmlFor="coupon-duration"
									className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block"
								>
									Duração
								</label>
								<select
									id="coupon-duration"
									value={formData.duration}
									onChange={(e) =>
										setFormData({
											...formData,
											duration: e.target.value as
												| 'once'
												| 'repeating'
												| 'forever',
										})
									}
									className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 focus:border-purple-500 focus:outline-none"
								>
									<option value="once">Uma vez</option>
									<option value="repeating">Recorrente</option>
									<option value="forever">Sempre</option>
								</select>
							</div>

							{/* Duration in months (only for repeating) */}
							{formData.duration === 'repeating' && (
								<div>
									<label
										htmlFor="coupon-duration-months"
										className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block"
									>
										Duração em meses
									</label>
									<input
										id="coupon-duration-months"
										type="number"
										min={1}
										value={formData.duration_in_months}
										onChange={(e) =>
											setFormData({
												...formData,
												duration_in_months: e.target.value,
											})
										}
										className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 focus:border-purple-500 focus:outline-none"
									/>
								</div>
							)}

							{/* Discount */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label
										htmlFor="coupon-discount-mode"
										className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block"
									>
										Tipo de desconto
									</label>
									<select
										id="coupon-discount-mode"
										value={discountMode}
										onChange={(e) =>
											setDiscountMode(e.target.value as 'percent' | 'amount')
										}
										className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 focus:border-purple-500 focus:outline-none"
									>
										<option value="percent">Percentual (%)</option>
										<option value="amount">Valor fixo</option>
									</select>
								</div>
								<div>
									<label
										htmlFor="coupon-discount-value"
										className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block"
									>
										{discountMode === 'percent'
											? 'Percentual (1–100)'
											: 'Valor (centavos)'}
									</label>
									{discountMode === 'percent' ? (
										<input
											id="coupon-discount-value"
											type="number"
											min={1}
											max={100}
											step="0.01"
											value={formData.percent_off}
											onChange={(e) =>
												setFormData({
													...formData,
													percent_off: e.target.value,
												})
											}
											className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 focus:border-purple-500 focus:outline-none"
										/>
									) : (
										<input
											id="coupon-discount-value"
											type="number"
											min={1}
											step="1"
											value={formData.amount_off}
											onChange={(e) =>
												setFormData({ ...formData, amount_off: e.target.value })
											}
											className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 focus:border-purple-500 focus:outline-none"
										/>
									)}
								</div>
							</div>

							{/* Max redemptions */}
							<div>
								<label
									htmlFor="coupon-max-redemptions"
									className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block"
								>
									Limite de usos (opcional)
								</label>
								<input
									id="coupon-max-redemptions"
									type="number"
									min={1}
									value={formData.max_redemptions}
									onChange={(e) =>
										setFormData({
											...formData,
											max_redemptions: e.target.value,
										})
									}
									placeholder="Ilimitado"
									className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 focus:border-purple-500 focus:outline-none"
								/>
							</div>

							{/* Redeem by */}
							<div>
								<label
									htmlFor="coupon-redeem-by"
									className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block"
								>
									Expira em (opcional)
								</label>
								<input
									id="coupon-redeem-by"
									type="datetime-local"
									value={formData.redeem_by}
									onChange={(e) =>
										setFormData({ ...formData, redeem_by: e.target.value })
									}
									className="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 focus:border-purple-500 focus:outline-none"
								/>
							</div>

							<p className="text-xs text-slate-500 dark:text-slate-400">
								O preço final, após a aplicação do desconto, deve ser de no
								mínimo R$ 1,00.
							</p>
						</div>

						<div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
							<button
								type="button"
								onClick={() => {
									setShowModal(false);
									resetForm();
								}}
								className="px-6 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={handleSave}
								disabled={createMutation.isPending}
								className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
							>
								{createMutation.isPending && (
									<Loader2 className="h-4 w-4 animate-spin" />
								)}
								Criar cupom
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
