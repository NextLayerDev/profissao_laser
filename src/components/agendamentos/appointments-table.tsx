'use client';

import {
	Calendar,
	Check,
	CheckCircle,
	Loader2,
	Plus,
	Trash2,
	UserCheck,
	UserCog,
	X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
	useAppointments,
	useDeleteAppointment,
	useUpdateAppointmentStatus,
	useUpdateAppointmentTechnician,
} from '@/hooks/use-appointments';
import { useUsers } from '@/hooks/use-users';
import { getCurrentUser, getToken } from '@/lib/auth';
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
import { TechnicianAppointmentsView } from './technician-appointments-view';
import { UpdateStatusModal } from './update-status-modal';

interface AppointmentsTableProps {
	showCreateButton?: boolean;
}

export function AppointmentsTable({
	showCreateButton = true,
}: AppointmentsTableProps) {
	const [viewMode, setViewMode] = useState<
		'calendario' | 'cliente' | 'tecnico'
	>('calendario');
	const [selectedCustomerSearch, setSelectedCustomerSearch] =
		useState<string>('');
	const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');
	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [assignDropdownId, setAssignDropdownId] = useState<string | null>(null);
	const assignDropdownRef = useRef<HTMLDivElement>(null);
	const [statusModal, setStatusModal] = useState<{
		appointment: Appointment;
		newStatus: string;
	} | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);

	const { appointments, isLoading, error } = useAppointments();
	const { users } = useUsers();
	const updateStatus = useUpdateAppointmentStatus();
	const updateTechnician = useUpdateAppointmentTechnician();
	const currentUser = getCurrentUser();
	const technicians = useMemo(
		() =>
			users.filter(
				(u) =>
					u.role?.toLowerCase() === 'tecnico' ||
					u.role?.toLowerCase() === 'colaborador',
			),
		[users],
	);
	/** Mostra "Pegar para mim" quando o utilizador logado tem token admin/colaborador (pl_user_token) e tem sub no JWT */
	const canAssignToSelf = Boolean(getToken('user') && currentUser?.sub);
	const userNameMap = useMemo(
		() => Object.fromEntries(users.map((u) => [u.id, u.name])),
		[users],
	);
	const deleteAppointment = useDeleteAppointment();

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

	function handleAssignToMe(apt: Appointment) {
		if (!currentUser?.sub) return;
		updateTechnician.mutate(
			{ id: apt.id, technicianId: currentUser.sub },
			{
				onSuccess: () => toast.success('Atendimento atribuído a si.'),
				onError: () =>
					toast.error(
						'Erro ao atribuir. Verifique se o backend suporta esta ação.',
					),
			},
		);
	}

	function handleAssignTo(apt: Appointment, technicianId: string) {
		setAssignDropdownId(null);
		updateTechnician.mutate(
			{ id: apt.id, technicianId },
			{
				onSuccess: () => toast.success('Colaborador atribuído com sucesso.'),
				onError: () => toast.error('Erro ao atribuir colaborador.'),
			},
		);
	}

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (
				assignDropdownRef.current &&
				!assignDropdownRef.current.contains(e.target as Node)
			) {
				setAssignDropdownId(null);
			}
		}
		if (assignDropdownId) {
			document.addEventListener('mousedown', handleClickOutside);
		}
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [assignDropdownId]);

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
						<button
							type="button"
							onClick={() => setViewMode('tecnico')}
							className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
								viewMode === 'tecnico'
									? 'bg-violet-600 text-white'
									: 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5'
							}`}
						>
							<UserCog className="w-4 h-4" />
							Por técnico
						</button>
					</div>
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

			{viewMode === 'calendario' && (
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
													{apt.machine && ` · ${apt.machine}`}
													{apt.technicianId &&
														` · ${userNameMap[apt.technicianId] ?? '—'}`}
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
												{canAssignToSelf &&
													apt.status !== 'cancelado' &&
													apt.status !== 'concluido' && (
														<div
															className="relative"
															ref={
																assignDropdownId === apt.id
																	? assignDropdownRef
																	: undefined
															}
														>
															<button
																type="button"
																onClick={() =>
																	setAssignDropdownId(
																		assignDropdownId === apt.id ? null : apt.id,
																	)
																}
																disabled={updateTechnician.isPending}
																className="p-1.5 text-violet-500 hover:bg-violet-500/10 rounded-lg"
																title="Atribuir colaborador"
															>
																<UserCheck className="w-4 h-4" />
															</button>
															{assignDropdownId === apt.id && (
																<div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] shadow-lg py-1">
																	{currentUser?.sub && (
																		<button
																			type="button"
																			onClick={() => {
																				handleAssignToMe(apt);
																				setAssignDropdownId(null);
																			}}
																			className="w-full text-left px-3 py-2 text-sm text-violet-500 hover:bg-violet-500/10 font-medium"
																		>
																			Pegar para mim
																		</button>
																	)}
																	{technicians.length > 0 &&
																		currentUser?.sub && (
																			<div className="border-t border-slate-100 dark:border-white/5 my-1" />
																		)}
																	{technicians.map((t) => (
																		<button
																			key={t.id}
																			type="button"
																			onClick={() => handleAssignTo(apt, t.id)}
																			className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5"
																		>
																			{t.name}
																		</button>
																	))}
																</div>
															)}
														</div>
													)}
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
			)}

			{viewMode === 'cliente' && (
				<div className="space-y-4">
					<div className="flex flex-col sm:flex-row gap-3 max-w-md">
						<input
							type="text"
							value={selectedCustomerSearch}
							onChange={(e) => setSelectedCustomerSearch(e.target.value.trim())}
							placeholder="E-mail ou telefone do cliente"
							className="flex-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-500"
						/>
						<p className="text-sm text-slate-500 dark:text-gray-500 self-center">
							Insira o e-mail ou telefone do cliente para ver o calendário de
							agendamentos.
						</p>
					</div>
					{selectedCustomerSearch.trim() ? (
						<ClientAppointmentsView
							searchByEmailOrPhone={selectedCustomerSearch.trim()}
						/>
					) : (
						<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-8 text-center">
							<p className="text-slate-600 dark:text-gray-400">
								Insira o e-mail ou telefone do cliente acima para visualizar o
								calendário de agendamentos.
							</p>
						</div>
					)}
				</div>
			)}

			{viewMode === 'tecnico' && (
				<div className="space-y-4">
					<div className="flex flex-col sm:flex-row gap-3 max-w-md">
						<select
							value={selectedTechnicianId}
							onChange={(e) => setSelectedTechnicianId(e.target.value)}
							className="flex-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] px-3 py-2 text-sm text-slate-900 dark:text-white"
						>
							<option value="">Selecione o técnico</option>
							{technicians.map((t) => (
								<option key={t.id} value={t.id}>
									{t.name}
								</option>
							))}
						</select>
						{technicians.length === 0 && (
							<p className="text-sm text-slate-500 dark:text-gray-500 self-center">
								Nenhum técnico disponível. Verifique os utilizadores com role
								&quot;tecnico&quot; ou &quot;colaborador&quot;.
							</p>
						)}
					</div>
					<TechnicianAppointmentsView
						technicianId={selectedTechnicianId || null}
					/>
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
