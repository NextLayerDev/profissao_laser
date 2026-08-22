import { api } from '@/lib/fetch';
import {
	type Appointment,
	appointmentSchema,
	type ClientCooldown,
	type CreateAppointmentPayload,
} from '@/types/appointments';

export async function getAppointments(): Promise<Appointment[]> {
	const { data } = await api.get('/appointments');
	return appointmentSchema.array().parse(data);
}

export interface AvailableSlotsResponse {
	slots: string[];
	blocked: boolean;
	reason: string | null;
}

export async function getAvailableSlots(
	date: string,
	technicianId?: string,
): Promise<AvailableSlotsResponse> {
	const params: Record<string, string> = { date };
	if (technicianId) params.technicianId = technicianId;
	const { data } = await api.get<unknown>('/appointments/available-slots', {
		params,
	});

	// Compat: a API velha retornava string[]; a nova retorna {slots, blocked, reason}.
	if (Array.isArray(data)) {
		return { slots: data as string[], blocked: false, reason: null };
	}
	const obj = (data ?? {}) as Partial<AvailableSlotsResponse>;
	return {
		slots: Array.isArray(obj.slots) ? obj.slots : [],
		blocked: !!obj.blocked,
		reason: obj.reason ?? null,
	};
}

/**
 * Intervalo mínimo entre atendimentos do cliente. Sem `email`, o back responde
 * sobre o dono do token (é o caso do cliente marcando pra si).
 */
export async function getClientCooldown(params?: {
	email?: string;
	phone?: string;
	from?: string;
	days?: number;
}): Promise<ClientCooldown> {
	const { data } = await api.get<Partial<ClientCooldown>>(
		'/appointments/cooldown',
		{ params: params ?? undefined },
	);
	// Defensivo (mesmo espírito do getAvailableSlots): API sem a rota ou payload
	// parcial não pode quebrar o form — quem barra de verdade é o POST.
	return {
		enabled: !!data?.enabled,
		hours: data?.hours ?? 48,
		matchPhone: !!data?.matchPhone,
		blocked: !!data?.blocked,
		nextAllowedDate: data?.nextAllowedDate ?? null,
		blockedDates: Array.isArray(data?.blockedDates) ? data.blockedDates : [],
		lastAppointment: data?.lastAppointment ?? null,
	};
}

export async function getAppointmentsByCustomer(
	customerId: string,
): Promise<Appointment[]> {
	const { data } = await api.get(`/appointments/${customerId}`);
	return appointmentSchema.array().parse(data);
}

export async function getAppointmentsByTechnician(
	technicianId: string,
): Promise<Appointment[]> {
	const { data } = await api.get(`/appointments/technician/${technicianId}`);
	return appointmentSchema.array().parse(data);
}

export async function createAppointment(
	payload: CreateAppointmentPayload,
): Promise<Appointment> {
	const { data } = await api.post('/appointment', payload);
	return appointmentSchema.parse(data);
}

export async function updateAppointmentStatus(
	id: string,
	status: string,
): Promise<Appointment> {
	const { data } = await api.patch(`/appointment/${id}/status`, { status });
	return appointmentSchema.parse(data);
}

export async function deleteAppointment(id: string): Promise<void> {
	await api.delete(`/appointment/${id}`);
}

/** Cliente cancela o próprio agendamento (validação por e-mail no backend). */
export async function cancelMyAppointment(id: string): Promise<Appointment> {
	const { data } = await api.patch(`/appointment/${id}/cancel`);
	return appointmentSchema.parse(data);
}

export async function updateAppointmentTechnician(
	id: string,
	technicianId: string,
): Promise<Appointment> {
	const { data } = await api.patch(`/appointment/${id}`, { technicianId });
	return appointmentSchema.parse(data);
}
