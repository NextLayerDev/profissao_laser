'use client';

import { KeyRound, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Customer } from '@/types/customer';

interface ChangePasswordModalProps {
	customer: Customer | null;
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (id: string, password: string) => Promise<void>;
	isLoading?: boolean;
}

export function ChangePasswordModal({
	customer,
	isOpen,
	onClose,
	onConfirm,
	isLoading = false,
}: ChangePasswordModalProps) {
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');

	if (!isOpen || !customer) return null;

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!customer) return;
		if (password.length < 6) {
			toast.error('A senha deve ter pelo menos 6 caracteres.');
			return;
		}
		if (password !== confirm) {
			toast.error('As senhas não coincidem.');
			return;
		}
		try {
			await onConfirm(customer.id, password);
			toast.success('Senha alterada com sucesso.');
			setPassword('');
			setConfirm('');
			onClose();
		} catch {
			toast.error('Erro ao alterar senha.');
		}
	}

	function handleClose() {
		setPassword('');
		setConfirm('');
		onClose();
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm">
			<div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md mx-4 p-6 shadow-xl">
				<div className="flex items-center justify-between mb-5">
					<div className="flex items-center gap-2 text-violet-500 dark:text-violet-400">
						<KeyRound size={18} />
						<h2 className="text-base font-semibold text-slate-900 dark:text-white">
							Alterar senha
						</h2>
					</div>
					<button
						type="button"
						onClick={handleClose}
						className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
					>
						<X size={18} />
					</button>
				</div>

				<p className="text-slate-600 dark:text-gray-300 text-sm mb-1">Aluno:</p>
				<p className="text-slate-900 dark:text-white font-semibold mb-5">
					{customer.name}
				</p>

				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div>
						<label
							htmlFor="new-password"
							className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1"
						>
							Nova senha
						</label>
						<input
							id="new-password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={6}
							className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
						/>
					</div>
					<div>
						<label
							htmlFor="confirm-password"
							className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1"
						>
							Confirmar senha
						</label>
						<input
							id="confirm-password"
							type="password"
							value={confirm}
							onChange={(e) => setConfirm(e.target.value)}
							required
							minLength={6}
							className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
						/>
					</div>

					<div className="flex justify-end gap-3 mt-2">
						<button
							type="button"
							onClick={handleClose}
							disabled={isLoading}
							className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 text-slate-700 dark:text-white"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isLoading}
							className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50"
						>
							{isLoading && <Loader2 size={14} className="animate-spin" />}
							{isLoading ? 'Salvando...' : 'Salvar senha'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
