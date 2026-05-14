'use client';

import { Loader2, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCreateAddon } from '@/hooks/use-addons';
import type { CreateAddonPayload } from '@/types/addons';

interface CreateAddonModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function CreateAddonModal({ isOpen, onClose }: CreateAddonModalProps) {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [price, setPrice] = useState('');
	const [interval, setInterval] =
		useState<CreateAddonPayload['interval']>('month');

	const { mutate, isPending } = useCreateAddon();

	if (!isOpen) return null;

	function reset() {
		setName('');
		setDescription('');
		setPrice('');
		setInterval('month');
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const priceNumber = Number(price.replace(',', '.'));
		if (!name.trim() || !Number.isFinite(priceNumber) || priceNumber <= 0) {
			toast.error('Preencha nome e preço (maior que zero).');
			return;
		}

		mutate(
			{
				name: name.trim(),
				description: description.trim() || undefined,
				price: priceNumber,
				interval,
			},
			{
				onSuccess: () => {
					toast.success('Addon criado com sucesso.');
					reset();
					onClose();
				},
				onError: (err: unknown) => {
					const message =
						(err as { response?: { data?: { message?: string } } })?.response
							?.data?.message ?? 'Erro ao criar addon.';
					toast.error(message);
				},
			},
		);
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm">
			<form
				onSubmit={handleSubmit}
				className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md mx-4 p-6 shadow-xl"
			>
				<div className="flex items-center justify-between mb-5">
					<div className="flex items-center gap-2">
						<Plus size={18} className="text-violet-500" />
						<h2 className="text-base font-semibold text-slate-900 dark:text-white">
							Novo addon
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						disabled={isPending}
						className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50"
					>
						<X size={18} />
					</button>
				</div>

				<div className="space-y-4">
					<label className="block">
						<span className="text-xs font-medium text-slate-600 dark:text-gray-400">
							Nome
						</span>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							disabled={isPending}
							required
							className="mt-1 w-full bg-white dark:bg-[#0f0f10] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50"
						/>
					</label>

					<label className="block">
						<span className="text-xs font-medium text-slate-600 dark:text-gray-400">
							Descrição (opcional)
						</span>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							disabled={isPending}
							rows={3}
							className="mt-1 w-full bg-white dark:bg-[#0f0f10] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50 resize-none"
						/>
					</label>

					<div className="grid grid-cols-2 gap-3">
						<label className="block">
							<span className="text-xs font-medium text-slate-600 dark:text-gray-400">
								Preço (R$)
							</span>
							<input
								type="number"
								step="0.01"
								min="0.01"
								value={price}
								onChange={(e) => setPrice(e.target.value)}
								disabled={isPending}
								required
								className="mt-1 w-full bg-white dark:bg-[#0f0f10] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50"
							/>
						</label>

						<label className="block">
							<span className="text-xs font-medium text-slate-600 dark:text-gray-400">
								Cobrança
							</span>
							<select
								value={interval}
								onChange={(e) =>
									setInterval(e.target.value as CreateAddonPayload['interval'])
								}
								disabled={isPending}
								className="mt-1 w-full bg-white dark:bg-[#0f0f10] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50"
							>
								<option value="month">Mensal</option>
								<option value="year">Anual</option>
								<option value="one_time">Pagamento único</option>
							</select>
						</label>
					</div>
				</div>

				<div className="flex justify-end gap-3 mt-6">
					<button
						type="button"
						onClick={onClose}
						disabled={isPending}
						className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 text-slate-700 dark:text-white"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={isPending}
						className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50"
					>
						{isPending ? (
							<Loader2 size={14} className="animate-spin" />
						) : (
							<Plus size={14} />
						)}
						{isPending ? 'Criando...' : 'Criar addon'}
					</button>
				</div>
			</form>
		</div>
	);
}
