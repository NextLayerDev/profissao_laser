'use client';

import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { useDeleteStudent } from '@/hooks/use-students';
import type { Student } from '@/services/students';

interface Props {
	student: Student | null;
	onClose: () => void;
}

export function DeleteCustomerModal({ student, onClose }: Props) {
	const deleteMut = useDeleteStudent();

	if (!student) return null;

	async function handleDelete() {
		if (!student) return;
		try {
			await deleteMut.mutateAsync(student.id);
			toast.success('Aluno excluído com sucesso.');
			onClose();
		} catch {
			toast.error('Erro ao excluir aluno.');
		}
	}

	return (
		<ModalOverlay onClose={onClose} tone="plans">
			<div className="p-6 space-y-4">
				<div className="flex items-center gap-2 text-red-500">
					<AlertTriangle className="w-5 h-5" />
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						Excluir aluno
					</h3>
				</div>

				<p className="text-sm text-slate-600 dark:text-gray-300">
					Tem certeza que deseja excluir o aluno:
				</p>
				<div>
					<p className="text-sm font-semibold text-slate-900 dark:text-white">
						{student.name ?? 'Sem nome'}
					</p>
					<p className="text-xs text-slate-500 dark:text-gray-500">
						{student.email}
					</p>
				</div>
				<p className="text-sm text-slate-500 dark:text-gray-500">
					Esta ação não pode ser desfeita.
				</p>

				<div className="flex gap-3 pt-1">
					<button
						type="button"
						onClick={onClose}
						disabled={deleteMut.isPending}
						className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white disabled:opacity-50"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={handleDelete}
						disabled={deleteMut.isPending}
						className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60"
					>
						{deleteMut.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Trash2 className="w-4 h-4" />
						)}
						{deleteMut.isPending ? 'Excluindo...' : 'Excluir aluno'}
					</button>
				</div>
			</div>
		</ModalOverlay>
	);
}
