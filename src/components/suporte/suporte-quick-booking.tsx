'use client';

import { CalendarClock, ChevronRight, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { AppointmentForm } from '@/components/agendamentos/appointment-form';
import { ModalOverlay } from '@/components/ui/modal-overlay';

/**
 * Hero card "Agendar atendimento" no topo da página Suporte.
 * Abre um modal com o AppointmentForm padrão.
 */
export function SuporteQuickBooking() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<div className="relative overflow-hidden rounded-2xl border border-violet-200 dark:border-violet-800/40 bg-linear-to-br from-violet-50 via-white to-fuchsia-50 dark:from-violet-950/40 dark:via-[#1a1a1d] dark:to-fuchsia-950/30 p-5 md:p-6 mb-4">
				{/* glow */}
				<div className="absolute -top-12 -right-12 w-40 h-40 bg-violet-500/20 dark:bg-violet-500/30 blur-3xl pointer-events-none" />
				<div className="absolute -bottom-12 -left-12 w-40 h-40 bg-fuchsia-500/15 dark:bg-fuchsia-500/20 blur-3xl pointer-events-none" />

				<div className="relative flex items-center justify-between gap-4 flex-wrap">
					<div className="flex items-center gap-3 min-w-0">
						<div className="w-12 h-12 shrink-0 rounded-xl bg-linear-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
							<CalendarClock className="w-6 h-6" />
						</div>
						<div className="min-w-0">
							<h2 className="font-display text-lg md:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
								Agendar atendimento
								<Sparkles className="w-4 h-4 text-violet-500" />
							</h2>
							<p className="text-sm text-slate-600 dark:text-gray-400">
								Marque um horário com um dos técnicos. Folgas e feriados
								respeitados automaticamente.
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={() => setOpen(true)}
						className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-violet-500/30"
					>
						Agendar
						<ChevronRight className="w-4 h-4" />
					</button>
				</div>
			</div>

			{open && (
				<ModalOverlay onClose={() => setOpen(false)}>
					<div className="p-6 max-h-[90vh] overflow-y-auto">
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
									<CalendarClock className="w-5 h-5 text-violet-500" />
								</div>
								<h3 className="text-lg font-bold text-slate-900 dark:text-white">
									Agendar atendimento
								</h3>
							</div>
							<button
								type="button"
								onClick={() => setOpen(false)}
								className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
							>
								<X className="w-5 h-5" />
							</button>
						</div>
						<AppointmentForm onSuccess={() => setOpen(false)} />
					</div>
				</ModalOverlay>
			)}
		</>
	);
}
