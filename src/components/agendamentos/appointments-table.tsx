'use client';

import {
	Calendar,
	Check,
	CheckCircle,
	LayoutGrid,
	Loader2,
	Plus,
	Trash2,
	X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
	useAppointments,
	useDeleteAppointment,
	useUpdateAppointmentStatus,
} from '@/hooks/use-appointments';
import type { Appointment } from '@/types/appointments';
import {
	APPOINTMENT_STATUS_LABELS,
	APPOINTMENT_STATUS_STYLES,
} from '@/utils/constants/appointment-status';
import { formatAppointmentDate } from '@/utils/formatDate';
import { AppointmentsCalendar } from './appointments-calendar';
import { ClientAppointmentsView } from './client-appointments-view';
import { CreateAppointmentModal } from './create-appointment-modal';
import { DeleteAppointmentModal } from './delete-appointment-modal';
import { UpdateStatusModal } from './update-status-modal';

const STATUS_FILTERS = [
	{ value: 'todos', label: 'Todos' },
	{ value: 'pendente', label: 'Pendentes' },
	{ value: 'confirmado', label: 'Confirmados' },
	{ value: 'cancelado', label: 'Cancelados' },
	{ value: 'concluido', label: 'Concluídos' },
] as const;

interface AppointmentsTableProps {
	showCreateButton?: boolean;
}

export function AppointmentsTable({
	showCreateButton = true,
}: AppointmentsTableProps) {
	const [viewMode, setViewMode] = useState<'tabela' | 'calendario' | 'cliente'>(
		'tabela',
	);
	const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	const [statusFilter, setStatusFilter] = useState<string>('todos');
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [statusModal, setStatusModal] = useState<{
		appointment: Appointment;
		newStatus: string;
	} | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);

	const { appointments, isLoading, error } = useAppointments();
	const updateStatus = useUpdateAppointmentStatus();
	const deleteAppointment = useDeleteAppointment();

	const filtered = useMemo(() => {
		if (!appointments) return [];
		if (statusFilter === 'todos') return appointments;
		return appointments.filter((a) => a.status === statusFilter);
	}, [appointments, statusFilter]);

	const appointmentsForSelectedDate = useMemo(() => {
		if (!selectedDate || !appointments) return [];
		return appointments
			.filter((a) => a.date === selectedDate)
			.sort((a, b) => a.time.localeCompare(b.time));
	}, [appointments, selectedDate]);

	async function handleStatusChange(id: string, status: string) {
		updateStatus.mutate(
			{ id, status },
			{
				onSuccess: () => {
					toast.success('Status atualizado.');
					setStatusModal(null);
				},
				onError: () => {
					toast.error('Erro ao atualizar status.');
				},
			},
		);
	}

	async function handleDelete(id: string) {
		deleteAppointment.mutate(id, {
			onSuccess: () => {
				toast.success('Agendamento excluído.');
				setDeleteTarget(null);
			},
			onError: () => {
				toast.error('Erro ao excluir agendamento.');
			},
		});
	}

	if (isLoading) {
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
		<>
			<div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
				<div className="flex items-center gap-2 flex-wrap">
					<div className="flex rounded-lg border border-slate-200 dark:border-white/10 p-0.5">
						<button
							type="button"
							onClick={() => setViewMode('tabela')}
							className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
								viewMode === 'tabela'
									? 'bg-violet-600 text-white'
									: 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5'
							}`}
						>
							<LayoutGrid className="w-4 h-4" />
							Tabela
						</button>
						<button
							type="button"
							onClick={() => setViewMode('calendario')}
							className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
								viewMode === 'calendario'
									? 'bg-violet-600 text-white'
									: 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5'
							}`}
						>
							<Calendar className="w-4 h-4" />
							Calendário
						</button>
						<button
							type="button"
							onClick={() => setViewMode('cliente')}
							className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
								viewMode === 'cliente'
									? 'bg-violet-600 text-white'
									: 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5'
							}`}
						>
							Por cliente
						</button>
					</div>
					{viewMode === 'tabela' &&
						STATUS_FILTERS.map((f) => (
							<button
								key={f.value}
								type="button"
								onClick={() => setStatusFilter(f.value)}
								className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
									statusFilter === f.value
										? 'bg-violet-600 text-white'
										: 'bg-white dark:bg-[#1a1a1d] text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5'
								}`}
							>
								{f.label}
							</button>
						))}
				</div>
				{showCreateButton && (
					<button
						type="button"
						onClick={() => setShowCreateModal(true)}
						className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
					>
						<Plus className="w-4 h-4" />
						Novo agendamento
					</button>
				)}
			</div>

			{viewMode === 'calendario' ? (
				<div className="flex flex-col lg:flex-row gap-6">
					<div className="flex-shrink-0">
						<AppointmentsCalendar
							appointments={appointments ?? []}
							selectedDate={selectedDate}
							onDayClick={(date) => setSelectedDate(date)}
						/>
					</div>
					{selectedDate && (
						<div className="flex-1 min-w-0 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-4">
							<h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
								Agendamentos — {formatAppointmentDate(selectedDate)}
							</h3>
							{appointmentsForSelectedDate.length === 0 ? (
								<p className="text-slate-500 dark:text-gray-500 text-sm">
									Nenhum agendamento neste dia.
								</p>
							) : (
								<div className="space-y-2">
									{appointmentsForSelectedDate.map((apt) => (
										<div
											key={apt.id}
											className="flex items-center justify-between gap-4 py-2 border-b border-slate-100 dark:border-white/5 last:border-0"
										>
											<div>
												<p className="font-medium text-slate-900 dark:text-white">
													{apt.customerName}
												</p>
												<p className="text-sm text-slate-600 dark:text-gray-400">
													{apt.time} — {apt.service}
												</p>
											</div>
											<span
												className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
													APPOINTMENT_STATUS_STYLES[apt.status] ??
													'bg-slate-500/10 text-slate-400'
												}`}
											>
												{APPOINTMENT_STATUS_LABELS[apt.status] ?? apt.status}
											</span>
											<div className="flex gap-1">
												{apt.status === 'pendente' && (
													<button
														type="button"
														onClick={() =>
															setStatusModal({
																appointment: apt,
																newStatus: 'confirmado',
															})
														}
														className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg"
														title="Confirmar"
													>
														<Check className="w-4 h-4" />
													</button>
												)}
												{apt.status !== 'cancelado' &&
													apt.status !== 'concluido' && (
														<button
															type="button"
															onClick={() =>
																setStatusModal({
																	appointment: apt,
																	newStatus: 'cancelado',
																})
															}
															className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg"
															title="Cancelar"
														>
															<X className="w-4 h-4" />
														</button>
													)}
												{apt.status === 'confirmado' && (
													<button
														type="button"
														onClick={() =>
															setStatusModal({
																appointment: apt,
																newStatus: 'concluido',
															})
														}
														className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg"
														title="Concluir"
													>
														<CheckCircle className="w-4 h-4" />
													</button>
												)}
												<button
													type="button"
													onClick={() => setDeleteTarget(apt)}
													className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
													title="Excluir"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			) : (
				<div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-transparent shadow-sm dark:shadow-none">
					<table className="w-full text-sm">
						<thead>
							<tr className="bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-gray-400 text-left">
								<th className="px-4 py-3 font-medium">Nome</th>
								<th className="px-4 py-3 font-medium">E-mail</th>
								<th className="px-4 py-3 font-medium">Telefone</th>
								<th className="px-4 py-3 font-medium">Serviço</th>
								<th className="px-4 py-3 font-medium">Data</th>
								<th className="px-4 py-3 font-medium">Hora</th>
								<th className="px-4 py-3 font-medium">Status</th>
								<th className="px-4 py-3 font-medium text-right">Ações</th>
							</tr>
						</thead>
						<tbody>
							{filtered.length === 0 && (
								<tr>
									<td
										colSpan={8}
										className="px-4 py-10 text-center text-slate-500 dark:text-gray-500"
									>
										Nenhum agendamento encontrado.
									</td>
								</tr>
							)}
							{filtered.map((apt) => (
								<tr
									key={apt.id}
									className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/2 transition-colors"
								>
									<td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
										{apt.customerName}
									</td>
									<td className="px-4 py-3 text-slate-600 dark:text-gray-400">
										{apt.customerEmail}
									</td>
									<td className="px-4 py-3 text-slate-600 dark:text-gray-400">
										{apt.customerPhone ?? '—'}
									</td>
									<td className="px-4 py-3 text-slate-900 dark:text-white">
										{apt.service}
									</td>
									<td className="px-4 py-3 text-slate-600 dark:text-gray-400">
										{formatAppointmentDate(apt.date)}
									</td>
									<td className="px-4 py-3 text-slate-600 dark:text-gray-400">
										{apt.time}
									</td>
									<td className="px-4 py-3">
										<span
											className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
												APPOINTMENT_STATUS_STYLES[apt.status] ??
												'bg-slate-500/10 text-slate-400'
											}`}
										>
											{APPOINTMENT_STATUS_LABELS[apt.status] ?? apt.status}
										</span>
									</td>
									<td className="px-4 py-3 text-right">
										<div className="flex items-center justify-end gap-1">
											{apt.status === 'pendente' && (
												<button
													type="button"
													onClick={() =>
														setStatusModal({
															appointment: apt,
															newStatus: 'confirmado',
														})
													}
													className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
													title="Confirmar"
												>
													<Check className="w-4 h-4" />
												</button>
											)}
											{apt.status !== 'cancelado' &&
												apt.status !== 'concluido' && (
													<button
														type="button"
														onClick={() =>
															setStatusModal({
																appointment: apt,
																newStatus: 'cancelado',
															})
														}
														className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
														title="Cancelar"
													>
														<X className="w-4 h-4" />
													</button>
												)}
											{apt.status === 'confirmado' && (
												<button
													type="button"
													onClick={() =>
														setStatusModal({
															appointment: apt,
															newStatus: 'concluido',
														})
													}
													className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
													title="Concluir"
												>
													<CheckCircle className="w-4 h-4" />
												</button>
											)}
											<button
												type="button"
												onClick={() => setDeleteTarget(apt)}
												className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
												title="Excluir"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{viewMode === 'cliente' && (
				<div className="space-y-4">
					<div className="flex flex-col sm:flex-row gap-3 max-w-md">
						<input
							type="text"
							value={selectedCustomerId}
							onChange={(e) => setSelectedCustomerId(e.target.value.trim())}
							placeholder="ID do cliente (UUID)"
							className="flex-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-500"
						/>
						<p className="text-sm text-slate-500 dark:text-gray-500 self-center">
							Insira o UUID do cliente para ver o calendário de agendamentos.
						</p>
					</div>
					{selectedCustomerId ? (
						<ClientAppointmentsView customerId={selectedCustomerId} />
					) : (
						<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-8 text-center">
							<p className="text-slate-600 dark:text-gray-400">
								Insira o UUID do cliente acima para visualizar o calendário de
								agendamentos.
							</p>
						</div>
					)}
				</div>
			)}

			<UpdateStatusModal
				appointment={statusModal?.appointment ?? null}
				newStatus={statusModal?.newStatus ?? null}
				isOpen={!!statusModal}
				onClose={() => setStatusModal(null)}
				onConfirm={(id, status) => handleStatusChange(id, status)}
				isLoading={updateStatus.isPending}
			/>

			<DeleteAppointmentModal
				appointment={deleteTarget}
				isOpen={!!deleteTarget}
				onClose={() => setDeleteTarget(null)}
				onDelete={(id) => handleDelete(id)}
				isDeleting={deleteAppointment.isPending}
			/>

			<CreateAppointmentModal
				isOpen={showCreateModal}
				onClose={() => setShowCreateModal(false)}
			/>
		</>
	);
}
