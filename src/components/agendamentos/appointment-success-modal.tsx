'use client';

import { CheckCircle, X } from 'lucide-react';
import { formatAppointmentDate } from '@/utils/formatDate';

interface AppointmentSuccessModalProps {
	isOpen: boolean;
	onClose: () => void;
	date: string;
	time: string;
	service: string;
}

export function AppointmentSuccessModal({
	isOpen,
	onClose,
	date,
	time,
	service,
}: AppointmentSuccessModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm">
			<div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md mx-4 p-6 shadow-xl">
				<div className="flex items-center justify-between mb-5">
					<div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400">
						<CheckCircle size={24} />
						<h2 className="text-lg font-semibold text-slate-900 dark:text-white">
							Agendamento realizado
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
					>
						<X size={20} />
					</button>
				</div>

				<p className="text-slate-600 dark:text-gray-300 text-sm mb-4">
					O seu agendamento foi confirmado com sucesso.
				</p>

				<div className="rounded-xl bg-slate-50 dark:bg-white/5 p-4 space-y-2">
					<p className="text-slate-900 dark:text-white font-medium">
						{formatAppointmentDate(date, {
							weekday: 'long',
							day: '2-digit',
							month: 'long',
							year: 'numeric',
						})}
					</p>
					<p className="text-slate-600 dark:text-gray-400">
						{time} — {service}
					</p>
				</div>

				<button
					type="button"
					onClick={onClose}
					className="mt-6 w-full px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors"
				>
					Fechar
				</button>
			</div>
		</div>
	);
}
