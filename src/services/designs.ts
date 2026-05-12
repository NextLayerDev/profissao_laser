import { api } from '@/lib/fetch';
import type {
	CreateDesignPayload,
	Design,
	DesignsResponse,
	UpdateDesignPayload,
} from '@/types/designs';

export interface DesignsQueryParams {
	page?: number;
	limit?: number;
	search?: string;
}

export async function getDesigns(
	params?: DesignsQueryParams,
): Promise<DesignsResponse> {
	const { data } = await api.get<DesignsResponse>('/designs', { params });
	return data ?? { data: [], total: 0, page: 1, limit: 20 };
}

export async function getDesign(id: string): Promise<Design> {
	const { data } = await api.get<Design>(`/designs/${id}`);
	return data;
}

export async function createDesign(
	payload: CreateDesignPayload,
): Promise<Design> {
	const { data } = await api.post<Design>('/designs', payload);
	return data;
}

export async function updateDesign(
	id: string,
	payload: UpdateDesignPayload,
): Promise<Design> {
	const { data } = await api.put<Design>(`/designs/${id}`, payload);
	return data;
}

export async function uploadDesignThumbnail(
	id: string,
	file: File,
): Promise<Design> {
	const formData = new FormData();
	formData.append('file', file);
	const { data } = await api.post<Design>(`/designs/${id}/thumbnail`, formData);
	return data;
}

export async function deleteDesign(id: string): Promise<void> {
	await api.delete(`/designs/${id}`);
}
