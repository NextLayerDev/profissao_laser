export const APPOINTMENT_HOURS = { start: 8, end: 18 };
export const SLOT_DURATION_MINUTES = 30;

export function generateTimeSlots(): string[] {
	const slots: string[] = [];
	for (let h = APPOINTMENT_HOURS.start; h < APPOINTMENT_HOURS.end; h++) {
		for (let m = 0; m < 60; m += SLOT_DURATION_MINUTES) {
			slots.push(
				`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
			);
		}
	}
	return slots;
}
