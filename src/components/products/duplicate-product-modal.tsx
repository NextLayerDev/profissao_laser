'use client';

import { Check, Copy, Loader2, Settings2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useClasses } from '@/hooks/use-classes';
import { useDuplicateProduct } from '@/hooks/use-products';
import { useSystemClasses } from '@/hooks/use-system-classes';
import type {
	ProductClassInfo,
	ProductSystemClassInfo,
} from '@/types/components/product-card';
import type { Product } from '@/types/products';
import { TIER_STYLES } from '@/utils/constants/tier-styles';

interface DuplicateProductModalProps {
	product: Product;
	/** Classes às quais o produto já pertence (serão excluídas da seleção) */
	productClasses?: ProductClassInfo[];
	/** System classes às quais o produto original pertence (pré-selecionadas) */
	productSystemClasses?: ProductSystemClassInfo[];
	onClose: () => void;
	onSuccess?: () => void;
}

export function DuplicateProductModal({
	product,
	productClasses = [],
	productSystemClasses = [],
	onClose,
	onSuccess,
}: DuplicateProductModalProps) {
	const { classes } = useClasses();
	const { systemClasses } = useSystemClasses();
	const { mutate: duplicateProduct, isPending } = useDuplicateProduct();
	const [selectedClassId, setSelectedClassId] = useState<string>('');
	const [selectedSystemClassIds, setSelectedSystemClassIds] = useState<
		string[]
	>(() => productSystemClasses.map((sc) => sc.id));
	const [paymentType, setPaymentType] = useState<'single' | 'subscription'>(
		'single',
	);
	const [subscriptionInterval, setSubscriptionInterval] = useState<
		'month' | 'year' | 'week'
	>('month');
	const [price, setPrice] = useState<string>(
		product.price > 0 ? product.price.toString() : '',
	);
	const [category, setCategory] = useState<string>(product.category ?? '');
	const [refundDays, setRefundDays] = useState<string>(
		(product.refundDays ?? 7).toString(),
	);

	function toggleSystemClass(id: string) {
		setSelectedSystemClassIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		);
	}

	const activeClasses = classes.filter((c) => c.status === 'ativo');

	const interval = paymentType === 'single' ? 'one_time' : subscriptionInterval;
	const activeSystemClasses = systemClasses.filter(
		(sc) => sc.status === 'ativo',
	);

	function handleDuplicate() {
		if (!selectedClassId) {
			toast.error('Selecione uma classe para o produto duplicado.');
			return;
		}
		const priceNum = parseFloat(price.replace(',', '.'));
		if (Number.isNaN(priceNum) || priceNum < 0) {
			toast.error('Informe um valor válido para o produto.');
			return;
		}

		duplicateProduct(
			{
				product,
				classId: selectedClassId,
				payment: {
					price: priceNum,
					interval,
					category,
					refundDays: parseInt(refundDays, 10) || 7,
				},
				systemClassIds: selectedSystemClassIds,
			},
			{
				onSuccess: () => {
					toast.success('Produto duplicado com sucesso!');
					onSuccess?.();
					onClose();
				},
				onError: () => {
					toast.error('Erro ao duplicar produto.');
				},
			},
		);
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm">
			<div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg mx-4 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between mb-5">
					<div className="flex items-center gap-2 text-violet-500 dark:text-violet-400">
						<Copy size={18} />
						<h2 className="text-base font-semibold text-slate-900 dark:text-white">
							Duplicar produto
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
					>
						<X size={18} />
					</button>
				</div>

				<p className="text-slate-600 dark:text-gray-300 text-sm mb-1">
					Será criada uma cópia do produto:
				</p>
				<p className="text-slate-900 dark:text-white font-semibold mb-4">
					&quot;{product.name}&quot;
				</p>
				<p className="text-slate-500 dark:text-gray-500 text-sm mb-4">
					Módulos, aulas, vídeos (mesmos links) e quizzes serão copiados.
					Selecione uma classe diferente e configure as informações de
					pagamento:
				</p>

				{/* Informações de pagamento (igual ao AddCourseModal) */}
				<div className="space-y-4 mb-6">
					<fieldset>
						<legend className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
							Tipo de pagamento
						</legend>
						<div className="flex gap-4">
							<button
								type="button"
								onClick={() => setPaymentType('single')}
								className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
									paymentType === 'single'
										? 'bg-violet-600 text-white'
										: 'bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 text-slate-700 dark:text-gray-300'
								}`}
							>
								Pagamento único
							</button>
							<button
								type="button"
								onClick={() => setPaymentType('subscription')}
								className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
									paymentType === 'subscription'
										? 'bg-violet-600 text-white'
										: 'bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 text-slate-700 dark:text-gray-300'
								}`}
							>
								Assinatura
							</button>
						</div>
					</fieldset>

					{paymentType === 'subscription' && (
						<div>
							<label
								htmlFor="duplicate-subscription-interval"
								className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
							>
								Intervalo de cobrança
							</label>
							<select
								id="duplicate-subscription-interval"
								value={subscriptionInterval}
								onChange={(e) =>
									setSubscriptionInterval(
										e.target.value as typeof subscriptionInterval,
									)
								}
								className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
							>
								<option value="week">Semanal</option>
								<option value="month">Mensal</option>
								<option value="year">Anual</option>
							</select>
						</div>
					)}

					<div>
						<label
							htmlFor="duplicate-price"
							className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
						>
							Valor
						</label>
						<div className="relative">
							<span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-gray-500 text-sm">
								R$
							</span>
							<input
								id="duplicate-price"
								type="text"
								inputMode="decimal"
								value={price}
								onChange={(e) => setPrice(e.target.value)}
								placeholder="0,00"
								className="w-full px-4 py-2.5 pl-10 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl text-slate-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label
								htmlFor="duplicate-category"
								className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
							>
								Categoria (opcional)
							</label>
							<input
								id="duplicate-category"
								type="text"
								value={category}
								onChange={(e) => setCategory(e.target.value)}
								placeholder="Ex: Tecnologia"
								className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl text-slate-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
							/>
						</div>
						<div>
							<label
								htmlFor="duplicate-refund-days"
								className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
							>
								Dias de reembolso
							</label>
							<input
								id="duplicate-refund-days"
								type="number"
								min={0}
								value={refundDays}
								onChange={(e) => setRefundDays(e.target.value)}
								className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
							/>
						</div>
					</div>
				</div>

				<div className="mb-6">
					<label
						htmlFor="duplicate-class"
						className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
					>
						Classe
					</label>
					<select
						id="duplicate-class"
						value={selectedClassId}
						onChange={(e) => setSelectedClassId(e.target.value)}
						className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
					>
						<option value="">Selecione uma classe</option>
						{activeClasses.map((cls) => {
							const style = TIER_STYLES[cls.tier];
							return (
								<option key={cls.id} value={cls.id}>
									{cls.name} ({style.label})
								</option>
							);
						})}
					</select>
					{activeClasses.length === 0 && (
						<p className="text-amber-600 dark:text-amber-400 text-xs mt-1">
							Nenhuma classe ativa. Crie uma classe primeiro.
						</p>
					)}
				</div>

				{activeSystemClasses.length > 0 && (
					<div className="mb-6">
						<div className="flex items-center gap-2 mb-2">
							<Settings2 className="w-4 h-4 text-purple-400" />
							<span className="text-sm font-medium text-slate-700 dark:text-gray-300">
								Classes do Sistema
							</span>
						</div>
						<div className="grid grid-cols-1 gap-2">
							{activeSystemClasses.map((sc) => {
								const isSelected = selectedSystemClassIds.includes(sc.id);
								return (
									<button
										key={sc.id}
										type="button"
										onClick={() => toggleSystemClass(sc.id)}
										className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
											isSelected
												? 'bg-violet-600/20 border border-violet-500/50 text-violet-600 dark:text-violet-300'
												: 'bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:border-slate-300 dark:hover:border-gray-600'
										}`}
									>
										<span
											className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
												isSelected
													? 'bg-violet-600 border-violet-600'
													: 'border-slate-300 dark:border-gray-600'
											}`}
										>
											{isSelected && <Check className="w-3 h-3 text-white" />}
										</span>
										{sc.name}
									</button>
								);
							})}
						</div>
					</div>
				)}

				<div className="flex justify-end gap-3">
					<button
						type="button"
						onClick={onClose}
						disabled={isPending}
						className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 text-slate-700 dark:text-white"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={handleDuplicate}
						disabled={isPending || !selectedClassId || !price.trim()}
						className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{isPending && <Loader2 size={14} className="animate-spin" />}
						{isPending ? 'Duplicando...' : 'Duplicar produto'}
					</button>
				</div>
			</div>
		</div>
	);
}
