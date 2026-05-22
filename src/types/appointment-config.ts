export interface WorkingDays {
	mon: boolean;
	tue: boolean;
	wed: boolean;
	thu: boolean;
	fri: boolean;
	sat: boolean;
	sun: boolean;
}

export interface GlobalConfig {
	id: string;
	workingDays: WorkingDays;
	workingHourStart: string; // HH:MM
	workingHourEnd: string;
	lunchStart: string | null;
	lunchEnd: string | null;
	slotDurationMinutes: number;
	updatedAt: string;
	updatedBy: string | null;
}

export interface UpdateGlobalConfigPayload {
	workingDays?: WorkingDays;
	workingHourStart?: string;
	workingHourEnd?: string;
	lunchStart?: string | null;
	lunchEnd?: string | null;
	slotDurationMinutes?: number;
}

export interface Holiday {
	id: string;
	date: string; // YYYY-MM-DD
	label: string;
	recurringYearly: boolean;
	createdBy: string | null;
	createdAt: string;
}

export interface CreateHolidayPayload {
	date: string;
	label: string;
	recurringYearly?: boolean;
}

export interface DayOff {
	id: string;
	technicianId: string | null;
	date: string;
	reason: string | null;
	createdBy: string | null;
	createdAt: string;
}

export interface CreateDayOffPayload {
	technicianId?: string | null;
	date: string;
	reason?: string;
}

export interface TechnicianSchedule {
	id: string;
	technicianId: string;
	workingDays: WorkingDays | null;
	workingHourStart: string | null;
	workingHourEnd: string | null;
	lunchStart: string | null;
	lunchEnd: string | null;
	updatedAt: string;
}

export interface UpsertTechnicianSchedulePayload {
	workingDays?: WorkingDays | null;
	workingHourStart?: string | null;
	workingHourEnd?: string | null;
	lunchStart?: string | null;
	lunchEnd?: string | null;
}
