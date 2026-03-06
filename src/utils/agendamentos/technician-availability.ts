import type { Appointment } from '@/types/appointments';
import { SLOT_DURATION_MINUTES } from '@/utils/constants/appointment-hours';

const ACTIVE_STATUSES = ['pendente', 'confirmado'] as const;

function isAppointmentInSlot(
	apt: Appointment,
	slot: string,
	date: string,
): boolean {
	if (apt.date !== date) return false;
	if (!ACTIVE_STATUSES.includes(apt.status as (typeof ACTIVE_STATUSES)[number]))
		return false;
	const [aptH, aptM] = apt.time.split(':').map(Number);
	const [slotH, slotM] = slot.split(':').map(Number);
	const aptStart = aptH * 60 + aptM;
	const slotStart = slotH * 60 + slotM;
	return slotStart >= aptStart && slotStart < aptStart + SLOT_DURATION_MINUTES;
}

/**
 * Retorna os IDs dos técnicos com 0 agendamentos ativos no slot.
 * Um técnico está disponível se não tem nenhum agendamento (pendente/confirmado) nesse horário.
 */
export function getAvailableTechniciansAtSlot(
	slot: string,
	date: string,
	appointments: Appointment[],
	technicianIds: string[],
): string[] {
	const appointmentsInSlot = appointments.filter((apt) =>
		isAppointmentInSlot(apt, slot, date),
	);

	const technicianCountAtSlot = new Map<string, number>();
	for (const id of technicianIds) {
		technicianCountAtSlot.set(id, 0);
	}

	for (const apt of appointmentsInSlot) {
		const techId = apt.technicianId;
		if (techId && technicianCountAtSlot.has(techId)) {
			technicianCountAtSlot.set(
				techId,
				(technicianCountAtSlot.get(techId) ?? 0) + 1,
			);
		}
		// Agendamentos sem técnico não bloqueiam técnicos específicos
	}

	return technicianIds.filter((id) => (technicianCountAtSlot.get(id) ?? 0) < 1);
}

/**
 * Verifica se o slot está ocupado.
 * Caso 1: todos os técnicos têm >= 1 agendamento no slot.
 * Caso 2: total de agendamentos no slot >= número de técnicos (inclui não atribuídos).
 */
export function isSlotOccupiedByTechnicians(
	slot: string,
	date: string,
	appointments: Appointment[],
	technicianIds: string[],
): boolean {
	if (technicianIds.length === 0) return false;
	const appointmentsInSlot = appointments.filter((apt) =>
		isAppointmentInSlot(apt, slot, date),
	);
	if (appointmentsInSlot.length >= technicianIds.length) return true;
	const available = getAvailableTechniciansAtSlot(
		slot,
		date,
		appointments,
		technicianIds,
	);
	return available.length === 0;
}
