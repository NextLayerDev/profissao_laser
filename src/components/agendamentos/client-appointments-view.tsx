'use client';

import { CalendarPlus, Loader2, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
	useAppointments,
	useAppointmentsByCustomer,
} from '@/hooks/use-appointments';
import {
	APPOINTMENT_STATUS_LABELS,
	APPOINTMENT_STATUS_STYLES,
} from '@/utils/constants/appointment-status';
import { formatAppointmentDate } from '@/utils/formatDate';
import { AppointmentForm } from './appointment-form';
import { AppointmentSuccessModal } from './appointment-success-modal';
import { AppointmentsCalendar } from './appointments-calendar';

interface ClientAppointmentsViewProps {
	/** Admin: customer ID para ver agendamentos de um cliente específico. Cliente: undefined = usa GET /appointments */
	customerId?: string | null;
}

export function ClientAppointmentsView({
	customerId = null,
}: ClientAppointmentsViewProps) {
	const {
		appointments: appointmentsAll,
		isLoading: loadingAll,
		error: errorAll,
	} = useAppointments();
	const {
		appointments: appointmentsByCustomer,
		isLoading: loadingByCustomer,
		error: errorByCustomer,
	} = useAppointmentsByCustomer(customerId);

	const appointments = customerId ? appointmentsByCustomer : appointmentsAll;
	const isLoading = customerId ? loadingByCustomer : loadingAll;
	const error = customerId ? errorByCustomer : errorAll;

	const [showForm, setShowForm] = useState(false);
	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	const [successData, setSuccessData] = useState<{
		date: string;
		time: string;
		service: string;
	} | null>(null);
	const [calendarMonth, setCalendarMonth] = useState(() => ({
		year: new Date().getFullYear(),
		month: new Date().getMonth(),
	}));

	const filteredByMonth = useMemo(() => {
		if (!appointments) return [];
		return appointments.filter((apt) => {
			if (apt.status === 'cancelado') return false;
			const [y, m] = apt.date.split('-').map(Number);
			return y === calendarMonth.year && m === calendarMonth.month + 1;
		});
	}, [appointments, calendarMonth]);

	const appointmentsForSelectedDate = useMemo(() => {
		if (!selectedDate || !appointments) return [];
		return appointments
			.filter((a) => a.date === selectedDate)
			.sort((a, b) => a.time.localeCompare(b.time));
	}, [appointments, selectedDate]);

	const sortedAppointments = useMemo(
		() =>
			[...filteredByMonth].sort((a, b) => {
				if (a.date !== b.date) return a.date.localeCompare(b.date);
				return a.time.localeCompare(b.time);
			}),
		[filteredByMonth],
	);

	function handleFormSuccess(data: {
		date: string;
		time: string;
		service: string;
	}) {
		setSuccessData(data);
		setShowForm(false);
	}

	if (isLoading && !appointments) {
		return (
			<div className="flex justify-center py-20">
				<Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center py-20 text-red-400">
				Erro ao carregar agendamentos.
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col lg:flex-row gap-6">
				<div className="lg:w-80 flex-shrink-0">
					<AppointmentsCalendar
						appointments={appointments ?? []}
						selectedDate={selectedDate}
						onDayClick={(date) => setSelectedDate(date)}
						onMonthChange={(year, month) => setCalendarMonth({ year, month })}
					/>
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold text-slate-900 dark:text-white">
							{selectedDate
								? `Agendamentos — ${formatAppointmentDate(selectedDate)}`
								: 'Agendamentos do mês'}
						</h3>
						{!customerId && (
							<button
								type="button"
								onClick={() => setShowForm(true)}
								className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
							>
								<Plus className="w-4 h-4" />
								Novo agendamento
							</button>
						)}
					</div>

					{(selectedDate ? appointmentsForSelectedDate : sortedAppointments)
						.length === 0 ? (
						<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-8 text-center">
							<CalendarPlus className="w-12 h-12 text-slate-400 dark:text-gray-600 mx-auto mb-3" />
							<p className="text-slate-600 dark:text-gray-400">
								{selectedDate
									? 'Nenhum agendamento neste dia.'
									: 'Nenhum agendamento neste mês.'}
							</p>
							{!customerId && (
								<button
									type="button"
									onClick={() => setShowForm(true)}
									className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
								>
									<Plus className="w-4 h-4" />
									Agendar atendimento
								</button>
							)}
						</div>
					) : (
						<div className="space-y-3">
							{(selectedDate
								? appointmentsForSelectedDate
								: sortedAppointments
							).map((apt) => (
								<div
									key={apt.id}
									className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-4 flex items-center justify-between gap-4"
								>
									<div>
										<p className="font-medium text-slate-900 dark:text-white">
											{apt.service}
										</p>
										<p className="text-sm text-slate-600 dark:text-gray-400">
											{formatAppointmentDate(apt.date, {
												day: '2-digit',
												month: 'short',
											})}{' '}
											às {apt.time}
										</p>
									</div>
									<span
										className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
											APPOINTMENT_STATUS_STYLES[apt.status] ??
											'bg-slate-500/10 text-slate-400'
										}`}
									>
										{APPOINTMENT_STATUS_LABELS[apt.status] ?? apt.status}
									</span>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{showForm && !customerId && (
				<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold text-slate-900 dark:text-white">
							Novo agendamento
						</h3>
						<button
							type="button"
							onClick={() => setShowForm(false)}
							className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white"
						>
							Fechar
						</button>
					</div>
					<AppointmentForm onSuccess={handleFormSuccess} />
				</div>
			)}

			{successData && (
				<AppointmentSuccessModal
					isOpen={!!successData}
					onClose={() => setSuccessData(null)}
					date={successData.date}
					time={successData.time}
					service={successData.service}
				/>
			)}
		</div>
	);
}
