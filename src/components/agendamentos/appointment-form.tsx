'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useCreateAppointment } from '@/hooks/use-appointments';
import { useUsers } from '@/hooks/use-users';
import { getCurrentUser } from '@/lib/auth';
import type { CreateAppointmentPayload } from '@/types/appointments';
import { APPOINTMENT_SERVICES } from '@/utils/constants/appointment-services';
import { TimeSlotPicker } from './time-slot-picker';

interface AppointmentFormProps {
	onSuccess?: (data: { date: string; time: string; service: string }) => void;
}

export function AppointmentForm({ onSuccess }: AppointmentFormProps) {
	const user = getCurrentUser();
	const createMutation = useCreateAppointment();
	const { users } = useUsers();

	const technicians = useMemo(
		() =>
			users.filter(
				(u) =>
					u.role?.toLowerCase() === 'tecnico' ||
					u.role?.toLowerCase() === 'colaborador',
			),
		[users],
	);

	const [customerName, setCustomerName] = useState('');
	const [customerEmail, setCustomerEmail] = useState('');
	const [customerPhone, setCustomerPhone] = useState('');
	const [service, setService] = useState<string>(APPOINTMENT_SERVICES[0]);
	const [date, setDate] = useState('');
	const [time, setTime] = useState('');
	const [notes, setNotes] = useState('');
	const [technicianId, setTechnicianId] = useState<string>('');

	useEffect(() => {
		if (user?.name) setCustomerName(user.name);
		if (user?.email) setCustomerEmail(user.email);
	}, [user]);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const email = user?.email ?? customerEmail;
		if (!customerName.trim() || !email.trim() || !service || !date || !time) {
			toast.error('Preencha todos os campos obrigatórios.');
			return;
		}

		const payload: CreateAppointmentPayload = {
			customerName: customerName.trim(),
			customerEmail: email.trim(),
			service,
			date,
			time,
		};
		if (customerPhone.trim()) payload.customerPhone = customerPhone.trim();
		if (notes.trim()) payload.notes = notes.trim();
		if (technicianId) payload.technicianId = technicianId;

		createMutation.mutate(payload, {
			onSuccess: () => {
				if (onSuccess) {
					onSuccess({ date, time, service });
				} else {
					toast.success('Agendamento criado com sucesso!');
				}
				setCustomerPhone('');
				setService(APPOINTMENT_SERVICES[0]);
				setDate('');
				setTime('');
				setNotes('');
			},
			onError: () => {
				toast.error('Erro ao criar agendamento. Tente novamente.');
			},
		});
	}

	const today = new Date().toISOString().split('T')[0];

	return (
		<form
			onSubmit={handleSubmit}
			className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-6 shadow-sm dark:shadow-none"
		>
			<h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
				Novo agendamento
			</h3>

			<div className="grid gap-4 sm:grid-cols-2">
				<div>
					<label
						htmlFor="customerName"
						className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1"
					>
						Nome *
					</label>
					<input
						id="customerName"
						type="text"
						value={customerName}
						onChange={(e) => setCustomerName(e.target.value)}
						required
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
						placeholder="Seu nome"
					/>
				</div>

				<div>
					<label
						htmlFor="customerEmail"
						className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1"
					>
						E-mail *
					</label>
					<input
						id="customerEmail"
						type="email"
						value={user?.email ?? customerEmail}
						readOnly
						required
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/10 px-3 py-2 text-sm text-slate-900 dark:text-white cursor-not-allowed"
						placeholder="seu@email.com"
						title="O e-mail é o da sua conta e não pode ser alterado."
					/>
				</div>

				<div>
					<label
						htmlFor="customerPhone"
						className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1"
					>
						Telefone
					</label>
					<input
						id="customerPhone"
						type="tel"
						value={customerPhone}
						onChange={(e) => setCustomerPhone(e.target.value)}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
						placeholder="(00) 00000-0000"
					/>
				</div>

				<div>
					<label
						htmlFor="service"
						className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1"
					>
						Serviço *
					</label>
					<select
						id="service"
						value={service}
						onChange={(e) => setService(e.target.value)}
						required
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50"
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
						htmlFor="date"
						className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1"
					>
						Data *
					</label>
					<input
						id="date"
						type="date"
						value={date}
						onChange={(e) => {
							setDate(e.target.value);
							setTime('');
						}}
						min={today}
						required
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50"
					/>
				</div>

				<div>
					<TimeSlotPicker
						value={time}
						onChange={setTime}
						date={date}
						disabled={!date}
					/>
				</div>
				{technicians.length > 0 && (
					<div>
						<label
							htmlFor="technician"
							className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1"
						>
							Técnico
						</label>
						<select
							id="technician"
							value={technicianId}
							onChange={(e) => setTechnicianId(e.target.value)}
							className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50"
						>
							<option value="">Selecione (opcional)</option>
							{technicians.map((t) => (
								<option key={t.id} value={t.id}>
									{t.name}
								</option>
							))}
						</select>
					</div>
				)}
			</div>

			<div className="mt-4">
				<label
					htmlFor="notes"
					className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1"
				>
					Observações
				</label>
				<textarea
					id="notes"
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					rows={3}
					className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 resize-none"
					placeholder="Alguma informação adicional..."
				/>
			</div>

			<button
				type="submit"
				disabled={createMutation.isPending}
				className="mt-6 flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
			>
				{createMutation.isPending ? (
					<>
						<Loader2 className="w-4 h-4 animate-spin" />A agendar...
					</>
				) : (
					'Agendar atendimento'
				)}
			</button>
		</form>
	);
}
