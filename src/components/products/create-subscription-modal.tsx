'use client';

import { Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCreateSubscription } from '@/hooks/use-subscription';

interface CreateSubscriptionModalProps {
	stripeProductId: string;
	onClose: () => void;
}

export function CreateSubscriptionModal({
	stripeProductId,
	onClose,
}: CreateSubscriptionModalProps) {
	const [form, setForm] = useState({
		email: '',
		stripeProductId,
		amount: '',
		interval: 'month' as 'day' | 'week' | 'month' | 'year',
		intervalCount: '1',
		endsAt: '',
	});

	const mutation = useCreateSubscription();

	const handleSubmit = async () => {
		if (!form.email.trim()) {
			toast.error('Informe o e-mail do cliente');
			return;
		}
		if (!form.stripeProductId.trim()) {
			toast.error('Informe o Stripe Product ID');
			return;
		}
		if (!form.amount) {
			toast.error('Informe o valor da assinatura');
			return;
		}

		try {
			await mutation.mutateAsync({
				email: form.email,
				stripeProductId: form.stripeProductId,
				amount: parseFloat(form.amount),
				interval: form.interval,
				intervalCount: parseInt(form.intervalCount, 10) || 1,
				endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : '',
			});
			toast.success('Assinatura criada com sucesso!');
			onClose();
		} catch {
			toast.error('Erro ao criar assinatura');
		}
	};

	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
			<div className="bg-[#1a1a1d] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md">
				<div className="flex items-center justify-between p-5 border-b border-gray-700">
					<h3 className="text-lg font-bold text-white">Criar Assinatura</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
					>
						<X className="w-4 h-4 text-gray-400" />
					</button>
				</div>

				<div className="p-5 space-y-4">
					<div>
						<label
							htmlFor="sub-email"
							className="text-sm font-medium text-gray-300 mb-1.5 block"
						>
							E-mail do cliente
						</label>
						<input
							id="sub-email"
							type="email"
							value={form.email}
							onChange={(e) => setForm({ ...form, email: e.target.value })}
							placeholder="cliente@email.com"
							className="w-full px-3 py-2 bg-[#0d0d0f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
						/>
					</div>

					<div>
						<label
							htmlFor="sub-amount"
							className="text-sm font-medium text-gray-300 mb-1.5 block"
						>
							Valor (R$)
						</label>
						<input
							id="sub-amount"
							type="number"
							min={0}
							step="0.01"
							value={form.amount}
							onChange={(e) => setForm({ ...form, amount: e.target.value })}
							placeholder="0.00"
							className="w-full px-3 py-2 bg-[#0d0d0f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label
								htmlFor="sub-interval"
								className="text-sm font-medium text-gray-300 mb-1.5 block"
							>
								Intervalo
							</label>
							<select
								id="sub-interval"
								value={form.interval}
								onChange={(e) =>
									setForm({
										...form,
										interval: e.target.value as typeof form.interval,
									})
								}
								className="w-full px-3 py-2 bg-[#0d0d0f] border border-gray-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
							>
								<option value="day">Diário</option>
								<option value="week">Semanal</option>
								<option value="month">Mensal</option>
								<option value="year">Anual</option>
							</select>
						</div>

						<div>
							<label
								htmlFor="sub-interval-count"
								className="text-sm font-medium text-gray-300 mb-1.5 block"
							>
								Quantidade
							</label>
							<input
								id="sub-interval-count"
								type="number"
								min={1}
								value={form.intervalCount}
								onChange={(e) =>
									setForm({ ...form, intervalCount: e.target.value })
								}
								className="w-full px-3 py-2 bg-[#0d0d0f] border border-gray-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
							/>
						</div>
					</div>

					<div>
						<label
							htmlFor="sub-ends-at"
							className="text-sm font-medium text-gray-300 mb-1.5 block"
						>
							Expira em (opcional)
						</label>
						<input
							id="sub-ends-at"
							type="datetime-local"
							value={form.endsAt}
							onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
							className="w-full px-3 py-2 bg-[#0d0d0f] border border-gray-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
						/>
					</div>
				</div>

				<div className="flex justify-end gap-3 p-5 border-t border-gray-700">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors text-sm"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={handleSubmit}
						disabled={mutation.isPending}
						className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition-colors text-sm disabled:opacity-50"
					>
						{mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
						Criar assinatura
					</button>
				</div>
			</div>
		</div>
	);
}
