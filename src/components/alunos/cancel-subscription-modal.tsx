'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { useCancelStudentSubscription } from '@/hooks/use-students';
import type { Student } from '@/services/students';

interface Props {
	student: Student | null;
	onClose: () => void;
}

function formatDate(dateStr: string | null): string | null {
	if (!dateStr) return null;
	return new Date(dateStr).toLocaleDateString('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
}

export function CancelSubscriptionModal({ student, onClose }: Props) {
	const cancel = useCancelStudentSubscription();

	if (!student) return null;

	const renewal = formatDate(student.current_period_end);

	function handleConfirm() {
		if (!student) return;
		cancel.mutate(student.id, { onSuccess: () => onClose() });
	}

	return (
		<ModalOverlay onClose={onClose} tone="plans">
			<div className="p-6 space-y-4">
				<div className="flex items-center gap-2">
					<AlertTriangle className="w-5 h-5 text-amber-500" />
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						Cancelar assinatura
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

				{student.subscription_status ? (
					<p className="text-sm text-slate-600 dark:text-gray-300">
						O cancelamento ocorre no fim do período atual
						{renewal ? (
							<>
								{' '}
								— o aluno mantém acesso até <strong>{renewal}</strong>.
							</>
						) : (
							'.'
						)}{' '}
						Caso exista uma assinatura no Stripe, ela será cancelada lá; caso
						contrário, a assinatura local é marcada como cancelada.
					</p>
				) : (
					<p className="text-sm text-slate-500 dark:text-gray-500 py-2 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-lg">
						Este aluno não possui assinatura ativa.
					</p>
				)}

				<div className="flex gap-3 pt-1">
					<button
						type="button"
						onClick={onClose}
						disabled={cancel.isPending}
						className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white disabled:opacity-50"
					>
						Voltar
					</button>
					<button
						type="button"
						onClick={handleConfirm}
						disabled={cancel.isPending || !student.subscription_status}
						className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60"
					>
						{cancel.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
						{cancel.isPending ? 'Cancelando...' : 'Confirmar cancelamento'}
					</button>
				</div>
			</div>
		</ModalOverlay>
	);
}
