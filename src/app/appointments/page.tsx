'use client';

import { CalendarDays, Check, Clock, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ChatButton } from '@/components/dashboard/chat-button';
import { Header } from '@/components/dashboard/header';
import {
	useAppointments,
	useCreateAppointment,
	useDeleteAppointment,
	useUpdateAppointmentStatus,
} from '@/hooks/use-appointments';
import type {
	Appointment,
	AppointmentStatus,
	CreateAppointmentPayload,
} from '@/types/appointments';

const STATUS_CONFIG: Record<
	AppointmentStatus,
	{ label: string; color: string }
> = {
	pendente: { label: 'Pendente', color: 'bg-yellow-500/10 text-yellow-400' },
	confirmado: { label: 'Confirmado', color: 'bg-green-500/10 text-green-400' },
	cancelado: { label: 'Cancelado', color: 'bg-red-500/10 text-red-400' },
	concluido: { label: 'Concluído', color: 'bg-blue-500/10 text-blue-400' },
};

const SERVICES = [
	'Depilação a Laser',
	'Limpeza de Pele',
	'Peeling',
	'Microagulhamento',
	'Radiofrequência',
	'Criolipólise',
	'Outro',
];

const TIME_SLOTS = [
	'08:00',
	'08:30',
	'09:00',
	'09:30',
	'10:00',
	'10:30',
	'11:00',
	'11:30',
	'13:00',
	'13:30',
	'14:00',
	'14:30',
	'15:00',
	'15:30',
	'16:00',
	'16:30',
	'17:00',
	'17:30',
];

function NewAppointmentModal({ onClose }: { onClose: () => void }) {
	const { mutateAsync: createAppointment, isPending } = useCreateAppointment();
	const [form, setForm] = useState<CreateAppointmentPayload>({
		customerName: '',
		customerEmail: '',
		customerPhone: '',
		service: SERVICES[0],
		date: '',
		time: TIME_SLOTS[0],
		notes: '',
	});

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		try {
			await createAppointment(form);
			toast.success('Agendamento criado com sucesso!');
			onClose();
		} catch {
			toast.error('Erro ao criar agendamento.');
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
			<div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-lg mx-4 p-6">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-lg font-semibold">Novo Agendamento</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-gray-400 hover:text-white transition-colors"
					>
						<X size={20} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="col-span-2">
							<label
								htmlFor="customerName"
								className="block text-sm text-gray-400 mb-1"
							>
								Nome do cliente *
							</label>
							<input
								id="customerName"
								required
								value={form.customerName}
								onChange={(e) =>
									setForm({ ...form, customerName: e.target.value })
								}
								className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
								placeholder="Nome completo"
							/>
						</div>

						<div>
							<label
								htmlFor="customerEmail"
								className="block text-sm text-gray-400 mb-1"
							>
								E-mail *
							</label>
							<input
								id="customerEmail"
								required
								type="email"
								value={form.customerEmail}
								onChange={(e) =>
									setForm({ ...form, customerEmail: e.target.value })
								}
								className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
								placeholder="email@exemplo.com"
							/>
						</div>

						<div>
							<label
								htmlFor="customerPhone"
								className="block text-sm text-gray-400 mb-1"
							>
								Telefone
							</label>
							<input
								id="customerPhone"
								value={form.customerPhone}
								onChange={(e) =>
									setForm({ ...form, customerPhone: e.target.value })
								}
								className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
								placeholder="(00) 00000-0000"
							/>
						</div>

						<div className="col-span-2">
							<label
								htmlFor="service"
								className="block text-sm text-gray-400 mb-1"
							>
								Serviço *
							</label>
							<select
								id="service"
								required
								value={form.service}
								onChange={(e) => setForm({ ...form, service: e.target.value })}
								className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
							>
								{SERVICES.map((s) => (
									<option key={s} value={s} className="bg-[#18181b]">
										{s}
									</option>
								))}
							</select>
						</div>

						<div>
							<label
								htmlFor="date"
								className="block text-sm text-gray-400 mb-1"
							>
								Data *
							</label>
							<input
								id="date"
								required
								type="date"
								value={form.date}
								onChange={(e) => setForm({ ...form, date: e.target.value })}
								className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
							/>
						</div>

						<div>
							<label
								htmlFor="time"
								className="block text-sm text-gray-400 mb-1"
							>
								Horário *
							</label>
							<select
								id="time"
								required
								value={form.time}
								onChange={(e) => setForm({ ...form, time: e.target.value })}
								className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
							>
								{TIME_SLOTS.map((t) => (
									<option key={t} value={t} className="bg-[#18181b]">
										{t}
									</option>
								))}
							</select>
						</div>

						<div className="col-span-2">
							<label
								htmlFor="notes"
								className="block text-sm text-gray-400 mb-1"
							>
								Observações
							</label>
							<textarea
								id="notes"
								rows={3}
								value={form.notes}
								onChange={(e) => setForm({ ...form, notes: e.target.value })}
								className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 resize-none"
								placeholder="Informações adicionais..."
							/>
						</div>
					</div>

					<div className="flex justify-end gap-3 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isPending}
							className="px-4 py-2 text-sm rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors"
						>
							{isPending ? 'Salvando...' : 'Agendar'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

function AppointmentRow({ appointment }: { appointment: Appointment }) {
	const { mutate: updateStatus } = useUpdateAppointmentStatus();
	const { mutate: deleteAppointment } = useDeleteAppointment();
	const [showStatusMenu, setShowStatusMenu] = useState(false);

	const statusInfo = STATUS_CONFIG[appointment.status];

	function handleStatusChange(status: AppointmentStatus) {
		updateStatus(
			{ id: appointment.id, status },
			{
				onSuccess: () => toast.success('Status atualizado.'),
				onError: () => toast.error('Erro ao atualizar status.'),
			},
		);
		setShowStatusMenu(false);
	}

	function handleDelete() {
		if (!confirm('Remover este agendamento?')) return;
		deleteAppointment(appointment.id, {
			onSuccess: () => toast.success('Agendamento removido.'),
			onError: () => toast.error('Erro ao remover agendamento.'),
		});
	}

	const formattedDate = new Date(
		`${appointment.date}T00:00:00`,
	).toLocaleDateString('pt-BR');

	return (
		<tr className="border-t border-white/5 hover:bg-white/2 transition-colors">
			<td className="px-4 py-3 font-medium">{appointment.customerName}</td>
			<td className="px-4 py-3 text-gray-400">{appointment.customerEmail}</td>
			<td className="px-4 py-3 text-gray-400">
				{appointment.customerPhone ?? '—'}
			</td>
			<td className="px-4 py-3">{appointment.service}</td>
			<td className="px-4 py-3 text-gray-400">
				<span className="flex items-center gap-1.5">
					<CalendarDays size={13} />
					{formattedDate}
				</span>
			</td>
			<td className="px-4 py-3 text-gray-400">
				<span className="flex items-center gap-1.5">
					<Clock size={13} />
					{appointment.time}
				</span>
			</td>
			<td className="px-4 py-3">
				<div className="relative">
					<button
						type="button"
						onClick={() => setShowStatusMenu((v) => !v)}
						className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${statusInfo.color}`}
					>
						{statusInfo.label}
					</button>
					{showStatusMenu && (
						<div className="absolute left-0 top-full mt-1 z-10 bg-[#1c1c1f] border border-white/10 rounded-lg overflow-hidden shadow-xl min-w-[140px]">
							{(Object.keys(STATUS_CONFIG) as AppointmentStatus[]).map(
								(status) => (
									<button
										type="button"
										key={status}
										onClick={() => handleStatusChange(status)}
										className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-white/5 transition-colors"
									>
										{appointment.status === status && (
											<Check size={12} className="text-violet-400" />
										)}
										<span
											className={
												appointment.status === status
													? 'text-white'
													: 'text-gray-400'
											}
										>
											{STATUS_CONFIG[status].label}
										</span>
									</button>
								),
							)}
						</div>
					)}
				</div>
			</td>
			<td className="px-4 py-3">
				<button
					type="button"
					onClick={handleDelete}
					className="text-gray-600 hover:text-red-400 transition-colors"
				>
					<Trash2 size={15} />
				</button>
			</td>
		</tr>
	);
}

export default function Appointments() {
	const { appointments, isLoading, error } = useAppointments();
	const [showModal, setShowModal] = useState(false);
	const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'todos'>(
		'todos',
	);

	const filtered = appointments?.filter(
		(a) => statusFilter === 'todos' || a.status === statusFilter,
	);

	return (
		<div className="min-h-screen bg-[#0d0d0f] text-white font-sans">
			<Header />

			<main className="px-8 py-6">
				<div className="flex items-start justify-between mb-6">
					<div>
						<h2 className="text-2xl font-bold tracking-tight">Agendamentos</h2>
						<p className="text-gray-400 mt-1">
							Gerencie os agendamentos de atendimento dos seus clientes.
						</p>
					</div>
					<button
						type="button"
						onClick={() => setShowModal(true)}
						className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 transition-colors px-4 py-2 rounded-lg text-sm font-medium"
					>
						<Plus size={16} />
						Novo agendamento
					</button>
				</div>

				{/* Filter tabs */}
				<div className="flex items-center gap-2 mb-4">
					{(['todos', ...Object.keys(STATUS_CONFIG)] as const).map((status) => (
						<button
							type="button"
							key={status}
							onClick={() =>
								setStatusFilter(status as AppointmentStatus | 'todos')
							}
							className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
								statusFilter === status
									? 'bg-violet-600 text-white'
									: 'text-gray-400 hover:text-white hover:bg-white/5'
							}`}
						>
							{status === 'todos'
								? 'Todos'
								: STATUS_CONFIG[status as AppointmentStatus].label}
						</button>
					))}
				</div>

				{isLoading && (
					<div className="flex items-center justify-center py-20 text-gray-400">
						Carregando agendamentos...
					</div>
				)}

				{error && (
					<div className="flex items-center justify-center py-20 text-red-400">
						Erro ao carregar agendamentos.
					</div>
				)}

				{!isLoading && !error && (
					<div className="rounded-xl border border-white/10 overflow-hidden">
						<table className="w-full text-sm">
							<thead>
								<tr className="bg-white/5 text-gray-400 text-left">
									<th className="px-4 py-3 font-medium">Cliente</th>
									<th className="px-4 py-3 font-medium">E-mail</th>
									<th className="px-4 py-3 font-medium">Telefone</th>
									<th className="px-4 py-3 font-medium">Serviço</th>
									<th className="px-4 py-3 font-medium">Data</th>
									<th className="px-4 py-3 font-medium">Horário</th>
									<th className="px-4 py-3 font-medium">Status</th>
									<th className="px-4 py-3 font-medium" />
								</tr>
							</thead>
							<tbody>
								{(!filtered || filtered.length === 0) && (
									<tr>
										<td
											colSpan={8}
											className="px-4 py-10 text-center text-gray-500"
										>
											Nenhum agendamento encontrado.
										</td>
									</tr>
								)}
								{filtered?.map((appointment) => (
									<AppointmentRow
										key={appointment.id}
										appointment={appointment}
									/>
								))}
							</tbody>
						</table>
					</div>
				)}
			</main>

			<ChatButton />

			{showModal && <NewAppointmentModal onClose={() => setShowModal(false)} />}
		</div>
	);
}
