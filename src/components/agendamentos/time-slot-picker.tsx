'use client';

import { useMemo } from 'react';
import type { Appointment } from '@/types/appointments';
import { isSlotOccupiedByTechnicians } from '@/utils/agendamentos/technician-availability';
import { generateTimeSlots } from '@/utils/constants/appointment-hours';

interface TimeSlotPickerProps {
	value: string;
	onChange: (time: string) => void;
	/** Admin multi-select: value is comma-separated times, onChange receives comma-separated */
	valueMultiple?: string[];
	onChangeMultiple?: (times: string[]) => void;
	multiple?: boolean;
	date: string;
	/** Admin: appointments to filter occupied slots. Client: undefined = show all */
	appointments?: Appointment[] | null;
	/** IDs dos técnicos para verificar disponibilidade por técnico. Obrigatório quando appointments é passado. */
	technicianIds?: string[];
	/** Cliente: slots disponíveis da API GET /appointments/available-slots. Usado quando não há appointments. */
	availableSlotsFromApi?: string[];
	disabled?: boolean;
}

export function TimeSlotPicker({
	value,
	onChange,
	valueMultiple = [],
	onChangeMultiple,
	multiple = false,
	date,
	appointments = null,
	technicianIds = [],
	availableSlotsFromApi,
	disabled = false,
}: TimeSlotPickerProps) {
	const allSlots = useMemo(() => generateTimeSlots(), []);

	const availableSlots = useMemo(() => {
		if (!date || !appointments) return allSlots;
		if (technicianIds.length === 0) return allSlots;
		return allSlots.filter(
			(slot) =>
				!isSlotOccupiedByTechnicians(slot, date, appointments, technicianIds),
		);
	}, [allSlots, date, appointments, technicianIds]);

	const slots =
		appointments && technicianIds.length > 0
			? availableSlots
			: (availableSlotsFromApi ?? allSlots);

	const showGrid =
		(appointments && technicianIds.length > 0) ||
		(multiple && availableSlotsFromApi);

	if (showGrid) {
		const selected = multiple ? valueMultiple : value ? [value] : [];
		const toggleSlot = (slot: string) => {
			if (multiple && onChangeMultiple) {
				const next = selected.includes(slot)
					? selected.filter((s) => s !== slot)
					: [...selected, slot].sort();
				onChangeMultiple(next);
				if (next.length > 0) onChange(next[0]);
				else onChange('');
			} else {
				onChange(slot);
			}
		};

		return (
			<fieldset className="space-y-2">
				<legend className="block text-sm font-medium text-slate-600 dark:text-gray-400">
					Horário * {multiple && '(selecione um ou mais)'}
				</legend>
				<div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto">
					{slots.map((slot) => {
						const isSelected = selected.includes(slot);
						return (
							<button
								key={slot}
								type="button"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									if (!disabled) toggleSlot(slot);
								}}
								disabled={disabled}
								className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
									isSelected
										? 'bg-violet-600 text-white'
										: 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-300 hover:bg-violet-500/20 dark:hover:bg-violet-500/20 border border-slate-200 dark:border-white/10'
								}`}
							>
								{slot}
							</button>
						);
					})}
					{slots.length === 0 && (
						<p className="col-span-full text-sm text-slate-500 dark:text-gray-500 py-2">
							Nenhum horário disponível nesta data.
						</p>
					)}
				</div>
			</fieldset>
		);
	}

	return (
		<div>
			<label
				htmlFor="time-slot"
				className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1"
			>
				Horário *
			</label>
			<select
				id="time-slot"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				required
				className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50"
			>
				<option value="">Selecione o horário</option>
				{slots.map((slot) => (
					<option key={slot} value={slot}>
						{slot}
					</option>
				))}
			</select>
		</div>
	);
}
