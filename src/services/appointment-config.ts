import { api } from '@/lib/fetch';
import type {
	CreateDayOffPayload,
	CreateHolidayPayload,
	DayOff,
	GlobalConfig,
	Holiday,
	TechnicianSchedule,
	UpdateGlobalConfigPayload,
	UpsertTechnicianSchedulePayload,
} from '@/types/appointment-config';

const BASE = '/appointment-config';

export async function getGlobalConfig(): Promise<GlobalConfig> {
	const { data } = await api.get<GlobalConfig>(`${BASE}/global`);
	return data;
}

export async function updateGlobalConfig(
	payload: UpdateGlobalConfigPayload,
): Promise<GlobalConfig> {
	const { data } = await api.put<GlobalConfig>(`${BASE}/global`, payload);
	return data;
}

export async function listHolidays(): Promise<Holiday[]> {
	const { data } = await api.get<Holiday[]>(`${BASE}/holidays`);
	return data ?? [];
}

export async function addHoliday(
	payload: CreateHolidayPayload,
): Promise<Holiday> {
	const { data } = await api.post<Holiday>(`${BASE}/holidays`, payload);
	return data;
}

export async function deleteHoliday(id: string): Promise<void> {
	await api.delete(`${BASE}/holidays/${encodeURIComponent(id)}`);
}

export async function listDaysOff(params?: {
	technicianId?: string;
	from?: string;
	to?: string;
}): Promise<DayOff[]> {
	const { data } = await api.get<DayOff[]>(`${BASE}/days-off`, {
		params: params ?? undefined,
	});
	return data ?? [];
}

export async function addDayOff(payload: CreateDayOffPayload): Promise<DayOff> {
	const { data } = await api.post<DayOff>(`${BASE}/days-off`, payload);
	return data;
}

export async function deleteDayOff(id: string): Promise<void> {
	await api.delete(`${BASE}/days-off/${encodeURIComponent(id)}`);
}

export async function getTechSchedule(
	technicianId: string,
): Promise<TechnicianSchedule | null> {
	const { data } = await api.get<TechnicianSchedule | null>(
		`${BASE}/technician/${encodeURIComponent(technicianId)}`,
	);
	return data;
}

export async function upsertTechSchedule(
	technicianId: string,
	payload: UpsertTechnicianSchedulePayload,
): Promise<TechnicianSchedule> {
	const { data } = await api.put<TechnicianSchedule>(
		`${BASE}/technician/${encodeURIComponent(technicianId)}`,
		payload,
	);
	return data;
}
