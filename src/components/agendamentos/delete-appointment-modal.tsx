'use client';

import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import type { Appointment } from '@/types/appointments';
import { formatAppointmentDate } from '@/utils/formatDate';

interface DeleteAppointmentModalProps {
	appointment: Appointment | null;
	isOpen: boolean;
	onClose: () => void;
	onDelete: (id: string) => void;
	isDeleting?: boolean;
}

export function DeleteAppointmentModal({
	appointment,
	isOpen,
	onClose,
	onDelete,
	isDeleting = false,
}: DeleteAppointmentModalProps) {
	if (!isOpen || !appointment) return null;

	function handleDelete() {
		if (appointment) onDelete(appointment.id);
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm">
			<div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md mx-4 p-6 shadow-xl">
				<div className="flex items-center justify-between mb-5">
					<div className="flex items-center gap-2 text-red-500 dark:text-red-400">
						<AlertTriangle size={18} />
						<h2 className="text-base font-semibold text-slate-900 dark:text-white">
							Excluir agendamento
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
					Tem certeza que deseja excluir o agendamento:
				</p>
				<p className="text-slate-900 dark:text-white font-semibold mb-1">
					{appointment.customerName} — {appointment.service}
				</p>
				<p className="text-slate-500 dark:text-gray-500 text-sm mb-6">
					{formatAppointmentDate(appointment.date)} às {appointment.time}
				</p>
				<p className="text-slate-500 dark:text-gray-500 text-sm mb-6">
					Esta ação não pode ser desfeita.
				</p>

				<div className="flex justify-end gap-3">
					<button
						type="button"
						onClick={onClose}
						disabled={isDeleting}
						className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 text-slate-700 dark:text-white"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={handleDelete}
						disabled={isDeleting}
						className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50"
					>
						{isDeleting ? (
							<Loader2 size={14} className="animate-spin" />
						) : (
							<Trash2 size={14} />
						)}
						{isDeleting ? 'Excluindo...' : 'Excluir agendamento'}
					</button>
				</div>
			</div>
		</div>
	);
}
