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
	/** Só a equipe pode furar o intervalo mínimo; o back ignora vindo de cliente. */
	overrideCooldown: z.boolean().optional(),
});

export type CreateAppointmentPayload = z.infer<
	typeof createAppointmentPayloadSchema
>;

/**
 * Situação do intervalo mínimo entre atendimentos de um cliente.
 * Serve só pra avisar antes: quem decide é o POST /appointment.
 */
export interface ClientCooldown {
	enabled: boolean;
	hours: number;
	matchPhone: boolean;
	/** O dia inicial da consulta (hoje) está bloqueado? */
	blocked: boolean;
	/**
	 * Primeira data da janela com ALGUM horário livre — serve de piso pro
	 * `min` do input de data.
	 *
	 * NÃO use em texto: o dia do próprio atendimento é isento, então isto
	 * costuma ser hoje ou o próprio dia já marcado. A data exata de liberação
	 * vem do `reason` do available-slots e da mensagem do 409.
	 */
	nextAllowedDate: string | null;
	/** Dias 100% bloqueados na janela consultada (YYYY-MM-DD). */
	blockedDates: string[];
	lastAppointment: {
		id: string;
		date: string;
		time: string;
		service: string | null;
	} | null;
}
