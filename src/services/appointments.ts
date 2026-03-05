import { api } from '@/lib/fetch';
import {
	type Appointment,
	appointmentSchema,
	type CreateAppointmentPayload,
} from '@/types/appointments';

export async function getAppointments(): Promise<Appointment[]> {
	const { data } = await api.get('/appointments');
	return appointmentSchema.array().parse(data);
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

export async function updateAppointmentTechnician(
	id: string,
	technicianId: string,
): Promise<Appointment> {
	const { data } = await api.patch(`/appointment/${id}`, { technicianId });
	return appointmentSchema.parse(data);
}
