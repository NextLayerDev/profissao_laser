'use client';

import { Loader2, ShieldOff, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Customer } from '@/types/customer';

interface BlockCustomerModalProps {
	customer: Customer | null;
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (id: string, banned: boolean) => Promise<void>;
	isLoading?: boolean;
}

export function BlockCustomerModal({
	customer,
	isOpen,
	onClose,
	onConfirm,
	isLoading = false,
}: BlockCustomerModalProps) {
	if (!isOpen || !customer) return null;

	const willBlock = !customer.banned;

	async function handleConfirm() {
		if (!customer) return;
		try {
			await onConfirm(customer.id, willBlock);
			toast.success(willBlock ? 'Aluno bloqueado.' : 'Aluno desbloqueado.');
			onClose();
		} catch {
			toast.error('Erro ao alterar status do aluno.');
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm">
			<div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md mx-4 p-6 shadow-xl">
				<div className="flex items-center justify-between mb-5">
					<div className="flex items-center gap-2 text-amber-500 dark:text-amber-400">
						<ShieldOff size={18} />
						<h2 className="text-base font-semibold text-slate-900 dark:text-white">
							{willBlock ? 'Bloquear aluno' : 'Desbloquear aluno'}
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
					{willBlock
						? 'Tem certeza que deseja bloquear o aluno:'
						: 'Tem certeza que deseja desbloquear o aluno:'}
				</p>
				<p className="text-slate-900 dark:text-white font-semibold mb-1">
					{customer.name}
				</p>
				<p className="text-slate-500 dark:text-gray-500 text-sm mb-6">
					{customer.email}
				</p>

				<div className="flex justify-end gap-3">
					<button
						type="button"
						onClick={onClose}
						disabled={isLoading}
						className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 text-slate-700 dark:text-white"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={handleConfirm}
						disabled={isLoading}
						className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors disabled:opacity-50"
					>
						{isLoading && <Loader2 size={14} className="animate-spin" />}
						{willBlock ? 'Bloquear' : 'Desbloquear'}
					</button>
				</div>
			</div>
		</div>
	);
}
