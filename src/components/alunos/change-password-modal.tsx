'use client';

import { KeyRound, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { useSetStudentPassword } from '@/hooks/use-students';
import type { Student } from '@/services/students';

interface Props {
	student: Student | null;
	onClose: () => void;
}

export function ChangePasswordModal({ student, onClose }: Props) {
	const setPasswordMut = useSetStudentPassword();
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');

	if (!student) return null;

	function handleClose() {
		setPassword('');
		setConfirm('');
		onClose();
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!student) return;
		if (password.length < 6) {
			toast.error('A senha deve ter pelo menos 6 caracteres.');
			return;
		}
		if (password !== confirm) {
			toast.error('As senhas não coincidem.');
			return;
		}
		try {
			await setPasswordMut.mutateAsync({ id: student.id, password });
			toast.success('Senha alterada com sucesso.');
			handleClose();
		} catch {
			toast.error('Erro ao alterar senha.');
		}
	}

	const inputCls =
		'w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50';

	return (
		<ModalOverlay onClose={onClose} tone="plans">
			<form onSubmit={handleSubmit} className="p-6 space-y-4">
				<div className="flex items-center gap-2 text-violet-500">
					<KeyRound className="w-5 h-5" />
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						Alterar senha
					</h3>
				</div>

				<div>
					<p className="text-sm font-semibold text-slate-900 dark:text-white">
						{student.name ?? 'Sem nome'}
					</p>
					<p className="text-xs text-slate-500 dark:text-gray-500">
						{student.email}
					</p>
				</div>

				<div>
					<label
						htmlFor="student-new-password"
						className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5"
					>
						Nova senha
					</label>
					<input
						id="student-new-password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						minLength={6}
						className={inputCls}
					/>
				</div>

				<div>
					<label
						htmlFor="student-confirm-password"
						className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5"
					>
						Confirmar senha
					</label>
					<input
						id="student-confirm-password"
						type="password"
						value={confirm}
						onChange={(e) => setConfirm(e.target.value)}
						required
						minLength={6}
						className={inputCls}
					/>
				</div>

				<div className="flex gap-3 pt-1">
					<button
						type="button"
						onClick={handleClose}
						disabled={setPasswordMut.isPending}
						className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white disabled:opacity-50"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={setPasswordMut.isPending}
						className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-60"
					>
						{setPasswordMut.isPending && (
							<Loader2 className="w-4 h-4 animate-spin" />
						)}
						{setPasswordMut.isPending ? 'Salvando...' : 'Salvar senha'}
					</button>
				</div>
			</form>
		</ModalOverlay>
	);
}
