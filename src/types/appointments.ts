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
});

export type Appointment = z.infer<typeof appointmentSchema>;

export const createAppointmentPayloadSchema = z.object({
	customerName: z.string(),
	customerEmail: z.string(),
	customerPhone: z.string().optional(),
	service: z.string(),
	date: z.string(),
	time: z.string(),
	notes: z.string().optional(),
});

export type CreateAppointmentPayload = z.infer<
	typeof createAppointmentPayloadSchema
>;
