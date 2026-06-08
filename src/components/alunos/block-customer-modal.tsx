'use client';

import { Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { useSetStudentBlocked } from '@/hooks/use-students';
import type { Student } from '@/services/students';

interface Props {
	student: Student | null;
	onClose: () => void;
}

export function BlockCustomerModal({ student, onClose }: Props) {
	const setBlocked = useSetStudentBlocked();

	if (!student) return null;

	const willBlock = !student.blocked;
	const Icon = willBlock ? ShieldOff : ShieldCheck;

	async function handleConfirm() {
		if (!student) return;
		try {
			await setBlocked.mutateAsync({ id: student.id, blocked: willBlock });
			toast.success(willBlock ? 'Aluno bloqueado.' : 'Aluno desbloqueado.');
			onClose();
		} catch {
			toast.error('Erro ao alterar status do aluno.');
		}
	}

	return (
		<ModalOverlay onClose={onClose} tone="plans">
			<div className="p-6 space-y-4">
				<div className="flex items-center gap-2 text-amber-500">
					<Icon className="w-5 h-5" />
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						{willBlock ? 'Bloquear aluno' : 'Desbloquear aluno'}
					</h3>
				</div>

				<p className="text-sm text-slate-600 dark:text-gray-300">
					{willBlock
						? 'Tem certeza que deseja bloquear o aluno:'
						: 'Tem certeza que deseja desbloquear o aluno:'}
				</p>
				<div>
					<p className="text-sm font-semibold text-slate-900 dark:text-white">
						{student.name ?? 'Sem nome'}
					</p>
					<p className="text-xs text-slate-500 dark:text-gray-500">
						{student.email}
					</p>
				</div>

				<div className="flex gap-3 pt-1">
					<button
						type="button"
						onClick={onClose}
						disabled={setBlocked.isPending}
						className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white disabled:opacity-50"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={handleConfirm}
						disabled={setBlocked.isPending}
						className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors disabled:opacity-60"
					>
						{setBlocked.isPending && (
							<Loader2 className="w-4 h-4 animate-spin" />
						)}
						{willBlock ? 'Bloquear' : 'Desbloquear'}
					</button>
				</div>
			</div>
		</ModalOverlay>
	);
}
