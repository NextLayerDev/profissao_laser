export const APPOINTMENT_HOURS = { start: 8, end: 18 };
export const SLOT_DURATION_MINUTES = 60;
const LUNCH_START = 12;
const LUNCH_END = 13;

export function generateTimeSlots(): string[] {
	const slots: string[] = [];
	for (let h = APPOINTMENT_HOURS.start; h < APPOINTMENT_HOURS.end; h++) {
		if (h >= LUNCH_START && h < LUNCH_END) continue;
		slots.push(`${h.toString().padStart(2, '0')}:00`);
	}
	return slots;
}
