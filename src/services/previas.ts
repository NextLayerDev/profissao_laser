import { api } from '@/lib/fetch';
import type {
	GeneratePreviaPayload,
	Previa,
	PreviasAdminUsageResponse,
	PreviasQuota,
	PreviasResponse,
	UpdatePreviaPayload,
} from '@/types/previas';

export async function generatePrevia(
	payload: GeneratePreviaPayload,
): Promise<Previa> {
	const { data } = await api.post<Previa>('/previas/generate', payload);
	return data;
}

export async function getPreviasHistory(params?: {
	page?: number;
	limit?: number;
}): Promise<PreviasResponse> {
	const { data } = await api.get<PreviasResponse>('/previas/history', {
		params,
	});
	return data ?? { data: [], total: 0, page: 1, limit: 20 };
}

export async function updatePrevia(
	id: string,
	payload: UpdatePreviaPayload,
): Promise<Previa> {
	const { data } = await api.put<Previa>(`/previas/${id}`, payload);
	return data;
}

export async function deletePrevia(id: string): Promise<void> {
	await api.delete(`/previas/${id}`);
}

export async function getPreviasQuota(): Promise<PreviasQuota> {
	const { data } = await api.get<PreviasQuota>('/previas/quota');
	return data;
}

export async function getPreviasAdminUsage(params?: {
	page?: number;
	limit?: number;
	search?: string;
}): Promise<PreviasAdminUsageResponse> {
	const { data } = await api.get<PreviasAdminUsageResponse>(
		'/previas/admin/usage',
		{ params },
	);
	return data;
}
