import { z } from 'zod';

export const appointmentStatusSchema = z.enum([
	'pendente',
	'confirmado',
	'cancelado',
	'concluido',
]);

export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;

export const appointmentSchema = z.object({
	id: z.string(),
	customerName: z.string(),
	customerEmail: z.string(),
	customerPhone: z.string().nullable(),
	service: z.string(),
	date: z.string(),
	time: z.string(),
	status: appointmentStatusSchema,
	notes: z.string().nullable(),
	createdAt: z.string(),
	technicianId: z.string().uuid().nullable().optional(),
	machine: z.string().nullable().optional(),
});

export type Appointment = z.infer<typeof appointmentSchema>;

export const createAppointmentPayloadSchema = z.object({
	customerName: z.string(),
	customerEmail: z.string(),
	customerPhone: z.string().min(1),
	service: z.string(),
	date: z.string(),
	time: z.string(),
	machine: z.string().min(1),
	notes: z.string().optional(),
	technicianId: z.string().uuid().optional(),
});

export type CreateAppointmentPayload = z.infer<
	typeof createAppointmentPayloadSchema
>;
