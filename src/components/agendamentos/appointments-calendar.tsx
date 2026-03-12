'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Appointment } from '@/types/appointments';
import { APPOINTMENT_STATUS_STYLES } from '@/utils/constants/appointment-status';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
	'Janeiro',
	'Fevereiro',
	'Março',
	'Abril',
	'Maio',
	'Junho',
	'Julho',
	'Agosto',
	'Setembro',
	'Outubro',
	'Novembro',
	'Dezembro',
];

interface AppointmentsCalendarProps {
	appointments: Appointment[];
	selectedDate?: string | null;
	onMonthChange?: (year: number, month: number) => void;
	onDayClick?: (date: string) => void;
}

function getDaysInMonth(year: number, month: number) {
	const first = new Date(year, month, 1);
	const last = new Date(year, month + 1, 0);
	const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];
	const startPad = first.getDay();
	for (let i = 0; i < startPad; i++) {
		const d = new Date(year, month, -startPad + i + 1);
		days.push({
			date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
			day: d.getDate(),
			isCurrentMonth: false,
		});
	}
	for (let d = 1; d <= last.getDate(); d++) {
		days.push({
			date: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
			day: d,
			isCurrentMonth: true,
		});
	}
	const remaining = 42 - days.length;
	for (let i = 0; i < remaining; i++) {
		const d = new Date(year, month + 1, i + 1);
		days.push({
			date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
			day: d.getDate(),
			isCurrentMonth: false,
		});
	}
	return days;
}

export function AppointmentsCalendar({
	appointments,
	selectedDate,
	onMonthChange,
	onDayClick,
}: AppointmentsCalendarProps) {
	const [viewDate, setViewDate] = useState(() => new Date());
	const year = viewDate.getFullYear();
	const month = viewDate.getMonth();

	const days = useMemo(() => getDaysInMonth(year, month), [year, month]);

	const appointmentsByDate = useMemo(() => {
		const map = new Map<string, Appointment[]>();
		for (const apt of appointments) {
			if (apt.status === 'cancelado') continue;
			const list = map.get(apt.date) ?? [];
			list.push(apt);
			map.set(apt.date, list);
		}
		return map;
	}, [appointments]);

	function prevMonth() {
		const d = new Date(year, month - 1);
		setViewDate(d);
		onMonthChange?.(d.getFullYear(), d.getMonth());
	}

	function nextMonth() {
		const d = new Date(year, month + 1);
		setViewDate(d);
		onMonthChange?.(d.getFullYear(), d.getMonth());
	}

	const today = new Date().toISOString().split('T')[0];

	return (
		<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] overflow-hidden">
			<div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10">
				<button
					type="button"
					onClick={prevMonth}
					className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
				>
					<ChevronLeft className="w-5 h-5" />
				</button>
				<h3 className="text-base font-semibold text-slate-900 dark:text-white capitalize">
					{MONTHS[month]} {year}
				</h3>
				<button
					type="button"
					onClick={nextMonth}
					className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
				>
					<ChevronRight className="w-5 h-5" />
				</button>
			</div>

			<div className="p-4">
				<div className="grid grid-cols-7 gap-1 mb-2">
					{WEEKDAYS.map((w) => (
						<div
							key={w}
							className="text-center text-xs font-medium text-slate-500 dark:text-gray-500 py-1"
						>
							{w}
						</div>
					))}
				</div>
				<div className="grid grid-cols-7 gap-1">
					{days.map((d) => {
						const apts = appointmentsByDate.get(d.date) ?? [];
						const isToday = d.date === today;
						const isSelected = d.date === selectedDate;
						return (
							<button
								key={d.date}
								type="button"
								onClick={() => onDayClick?.(d.date)}
								className={`min-h-[3rem] rounded-lg text-sm transition-colors ${
									d.isCurrentMonth
										? 'text-slate-900 dark:text-white hover:bg-violet-500/20'
										: 'text-slate-400 dark:text-gray-600'
								} ${isToday ? 'ring-2 ring-violet-500' : ''} ${
									isSelected
										? 'bg-violet-600 text-white hover:bg-violet-500'
										: ''
								}`}
							>
								<span className="block">{d.day}</span>
								{apts.length > 0 && (
									<span className="flex justify-center gap-0.5 mt-0.5">
										{apts.slice(0, 3).map((a) => (
											<span
												key={a.id}
												className={`w-1.5 h-1.5 rounded-full ${
													APPOINTMENT_STATUS_STYLES[a.status]?.split(' ')[0] ??
													'bg-violet-500'
												}`}
											/>
										))}
										{apts.length > 3 && (
											<span className="text-[10px] text-slate-500">
												+{apts.length - 3}
											</span>
										)}
									</span>
								)}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
