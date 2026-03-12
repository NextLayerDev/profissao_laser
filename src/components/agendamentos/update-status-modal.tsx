'use client';

import { Loader2, X } from 'lucide-react';
import type { Appointment } from '@/types/appointments';
import { APPOINTMENT_STATUS_LABELS } from '@/utils/constants/appointment-status';
import { formatAppointmentDate } from '@/utils/formatDate';

interface UpdateStatusModalProps {
	appointment: Appointment | null;
	newStatus: string | null;
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (id: string, status: string) => void;
	isLoading?: boolean;
}

export function UpdateStatusModal({
	appointment,
	newStatus,
	isOpen,
	onClose,
	onConfirm,
	isLoading = false,
}: UpdateStatusModalProps) {
	if (!isOpen || !appointment || !newStatus) return null;

	const label = APPOINTMENT_STATUS_LABELS[newStatus] ?? newStatus;

	function handleConfirm() {
		if (appointment && newStatus) onConfirm(appointment.id, newStatus);
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm">
			<div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md mx-4 p-6 shadow-xl">
				<div className="flex items-center justify-between mb-5">
					<h2 className="text-base font-semibold text-slate-900 dark:text-white">
						Alterar status
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
					>
						<X size={18} />
					</button>
				</div>

				<p className="text-slate-600 dark:text-gray-300 text-sm mb-1">
					Alterar o agendamento de <strong>{appointment.customerName}</strong>{' '}
					para status <strong>{label}</strong>?
				</p>
				<p className="text-slate-500 dark:text-gray-500 text-sm mb-6">
					{appointment.service} — {formatAppointmentDate(appointment.date)} às{' '}
					{appointment.time}
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
						className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-violet-600 hover:bg-violet-500 transition-colors disabled:opacity-50"
					>
						{isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
						{isLoading ? 'A atualizar...' : `Marcar como ${label}`}
					</button>
				</div>
			</div>
		</div>
	);
}
