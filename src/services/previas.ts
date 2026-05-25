import { api } from '@/shared/lib/fetch';
import type {
	GeneratePreviaPayload,
	Previa,
	PreviaOptions,
	PreviasAdminUsageResponse,
	PreviasResponse,
	UpdatePreviaPayload,
	Watermark,
} from '@/types/previas';

export async function getPreviaOptions(): Promise<PreviaOptions> {
	const { data } = await api.get<PreviaOptions>('/previas/options');
	return data;
}

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

// ─── Watermark ──────────────────────────────────────────────────────────────

export async function getWatermark(): Promise<Watermark | null> {
	try {
		const { data } = await api.get<Watermark>('/watermark');
		return data;
	} catch (err: unknown) {
		const status = (err as { response?: { status?: number } })?.response
			?.status;
		if (status === 404) return null;
		throw err;
	}
}

export async function uploadWatermark(file: File): Promise<Watermark> {
	const fd = new FormData();
	fd.append('file', file);
	const { data } = await api.put<Watermark>('/watermark', fd);
	return data;
}

export async function deleteWatermark(): Promise<void> {
	await api.delete('/watermark');
}
