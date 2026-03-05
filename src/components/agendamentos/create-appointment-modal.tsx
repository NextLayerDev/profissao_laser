'use client';

import { Loader2, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
	useAppointments,
	useCreateAppointment,
} from '@/hooks/use-appointments';
import type { CreateAppointmentPayload } from '@/types/appointments';
import { APPOINTMENT_SERVICES } from '@/utils/constants/appointment-services';
import { TimeSlotPicker } from './time-slot-picker';

interface CreateAppointmentModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function CreateAppointmentModal({
	isOpen,
	onClose,
}: CreateAppointmentModalProps) {
	const createMutation = useCreateAppointment();
	const { appointments } = useAppointments();

	const [customerName, setCustomerName] = useState('');
	const [customerEmail, setCustomerEmail] = useState('');
	const [customerPhone, setCustomerPhone] = useState('');
	const [service, setService] = useState<string>(APPOINTMENT_SERVICES[0]);
	const [date, setDate] = useState('');
	const [time, setTime] = useState('');
	const [times, setTimes] = useState<string[]>([]);
	const [notes, setNotes] = useState('');

	useEffect(() => {
		if (!isOpen) {
			setCustomerName('');
			setCustomerEmail('');
			setCustomerPhone('');
			setService(APPOINTMENT_SERVICES[0]);
			setDate('');
			setTime('');
			setTimes([]);
			setNotes('');
		}
	}, [isOpen]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const slotsToUse = times.length > 0 ? times : time ? [time] : [];
		if (
			!customerName.trim() ||
			!customerEmail.trim() ||
			!service ||
			!date ||
			slotsToUse.length === 0
		) {
			toast.error(
				'Preencha todos os campos obrigatórios e selecione pelo menos um horário.',
			);
			return;
		}

		const basePayload: Omit<CreateAppointmentPayload, 'time'> = {
			customerName: customerName.trim(),
			customerEmail: customerEmail.trim(),
			service,
			date,
		};
		if (customerPhone.trim()) basePayload.customerPhone = customerPhone.trim();
		if (notes.trim()) basePayload.notes = notes.trim();

		try {
			for (const t of slotsToUse) {
				await createMutation.mutateAsync({
					...basePayload,
					time: t,
				});
			}
			toast.success(
				slotsToUse.length > 1
					? `${slotsToUse.length} agendamentos criados com sucesso.`
					: 'Agendamento criado com sucesso.',
			);
			onClose();
		} catch {
			toast.error('Erro ao criar agendamento(s). Tente novamente.');
		}
	}

	if (!isOpen) return null;

	const today = new Date().toISOString().split('T')[0];

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm p-4">
			<div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
				<div className="sticky top-0 bg-white dark:bg-[#18181b] border-b border-slate-200 dark:border-white/10 px-6 py-4 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Plus className="w-5 h-5 text-violet-400" />
						<h2 className="text-lg font-semibold text-slate-900 dark:text-white">
							Novo agendamento
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
					>
						<X size={20} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="p-6 space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<label
								htmlFor="create-customerName"
								className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1"
							>
								Nome *
							</label>
							<input
								id="create-customerName"
								type="text"
								value={customerName}
								onChange={(e) => setCustomerName(e.target.value)}
								required
								className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white"
							/>
						</div>
						<div>
							<label
								htmlFor="create-customerEmail"
								className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1"
							>
								E-mail *
							</label>
							<input
								id="create-customerEmail"
								type="email"
								value={customerEmail}
								onChange={(e) => setCustomerEmail(e.target.value)}
								required
								className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white"
							/>
						</div>
						<div>
							<label
								htmlFor="create-customerPhone"
								className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1"
							>
								Telefone
							</label>
							<input
								id="create-customerPhone"
								type="tel"
								value={customerPhone}
								onChange={(e) => setCustomerPhone(e.target.value)}
								className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white"
							/>
						</div>
						<div>
							<label
								htmlFor="create-service"
								className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1"
							>
								Serviço *
							</label>
							<select
								id="create-service"
								value={service}
								onChange={(e) => setService(e.target.value)}
								required
								className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white"
							>
								{APPOINTMENT_SERVICES.map((s) => (
									<option key={s} value={s}>
										{s}
									</option>
								))}
							</select>
						</div>
						<div>
							<label
								htmlFor="create-date"
								className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1"
							>
								Data *
							</label>
							<input
								id="create-date"
								type="date"
								value={date}
								onChange={(e) => {
									setDate(e.target.value);
									setTime('');
								}}
								min={today}
								required
								className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white"
							/>
						</div>
						<div className="sm:col-span-2">
							<TimeSlotPicker
								value={times[0] ?? time}
								onChange={setTime}
								valueMultiple={times}
								onChangeMultiple={setTimes}
								multiple
								date={date}
								appointments={appointments ?? undefined}
								disabled={!date}
							/>
						</div>
					</div>
					<div>
						<label
							htmlFor="create-notes"
							className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1"
						>
							Observações
						</label>
						<textarea
							id="create-notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={2}
							className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white resize-none"
						/>
					</div>
					<div className="flex justify-end gap-3 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={createMutation.isPending}
							className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium rounded-xl"
						>
							{createMutation.isPending ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />A criar...
								</>
							) : (
								'Criar agendamento'
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
