'use client';

import { KeyRound, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { updateUserPassword } from '@/services/users';

interface ChangePasswordModalProps {
	isOpen: boolean;
	onClose: () => void;
	userId: string;
}

export function ChangePasswordModal({
	isOpen,
	onClose,
	userId,
}: ChangePasswordModalProps) {
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	if (!isOpen) return null;

	function handleClose() {
		setPassword('');
		setConfirmPassword('');
		onClose();
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (password.length < 6) {
			toast.error('A senha deve ter pelo menos 6 caracteres.');
			return;
		}
		if (password !== confirmPassword) {
			toast.error('As senhas não coincidem.');
			return;
		}

		setIsSubmitting(true);
		try {
			await updateUserPassword(userId, password);
			toast.success('Senha alterada com sucesso.');
			handleClose();
		} catch {
			toast.error('Erro ao alterar senha.');
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<button
				type="button"
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={handleClose}
				onKeyDown={(e) => {
					if (e.key === 'Escape') handleClose();
				}}
			>
				<span className="sr-only">Fechar modal</span>
			</button>

			<div className="relative bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
						<KeyRound className="w-5 h-5 text-violet-400" />
						Trocar senha
					</h2>
					<button
						type="button"
						onClick={handleClose}
						className="p-2 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-[#252528]"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label
							htmlFor="new-password"
							className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5"
						>
							Nova senha
						</label>
						<input
							id="new-password"
							type="password"
							required
							minLength={6}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Mínimo 6 caracteres"
							className="w-full bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
						/>
					</div>

					<div>
						<label
							htmlFor="confirm-password"
							className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5"
						>
							Confirmar senha
						</label>
						<input
							id="confirm-password"
							type="password"
							required
							minLength={6}
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder="Repita a nova senha"
							className="w-full bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
						/>
					</div>

					<div className="flex gap-3 pt-2">
						<button
							type="button"
							onClick={handleClose}
							className="flex-1 px-5 py-3 rounded-xl font-medium text-sm bg-slate-100 dark:bg-[#252528] hover:bg-slate-200 dark:hover:bg-[#2a2a2d] text-slate-700 dark:text-gray-300 transition-colors"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50"
						>
							{isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
							Alterar senha
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
