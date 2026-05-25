import { api } from '@/shared/lib/fetch';
import type {
	CreateLaserLineTypePayload,
	LaserLineType,
	LaserLineTypeSoftware,
	UpdateLaserLineTypePayload,
} from '@/types/laser-line-type';

export async function getLaserLineTypes(
	software?: LaserLineTypeSoftware,
): Promise<LaserLineType[]> {
	const params = software ? { software } : undefined;
	const { data } = await api.get<LaserLineType[]>('/laser-line-types', {
		params,
	});
	return data ?? [];
}

export async function createLaserLineType(
	payload: CreateLaserLineTypePayload,
): Promise<LaserLineType> {
	const fd = new FormData();
	fd.append('software', payload.software);
	fd.append('name', payload.name);
	fd.append('order', String(payload.order ?? 0));
	if (payload.file) fd.append('file', payload.file);
	const { data } = await api.post<LaserLineType>('/laser-line-types', fd);
	return data;
}

export async function updateLaserLineType(
	id: string,
	payload: UpdateLaserLineTypePayload,
): Promise<LaserLineType> {
	const url = `/laser-line-types/${encodeURIComponent(id)}`;
	if (payload.file) {
		const fd = new FormData();
		if (payload.software) fd.append('software', payload.software);
		if (payload.name) fd.append('name', payload.name);
		if (payload.order !== undefined) fd.append('order', String(payload.order));
		fd.append('file', payload.file);
		const { data } = await api.patch<LaserLineType>(url, fd);
		return data;
	}
	const { data } = await api.patch<LaserLineType>(url, {
		software: payload.software,
		name: payload.name,
		order: payload.order,
	});
	return data;
}

export async function deleteLaserLineType(id: string): Promise<void> {
	await api.delete(`/laser-line-types/${encodeURIComponent(id)}`);
}
