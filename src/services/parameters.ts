import { api } from '@/lib/fetch';
import type {
	LaserParameter,
	ParameterMachine,
	ParameterMaterial,
	ParameterStats,
	ParametersResponse,
} from '@/types/parameters';

// ─── Query params ────────────────────────────────────────────────────────────

export interface ParametersQueryParams {
	page?: number;
	limit?: number;
	machine?: string;
	model?: string;
	material?: string;
	thickness?: string;
	search?: string;
	mode?: string;
}

export interface CommunityParametersQueryParams extends ParametersQueryParams {
	sort?: 'recent' | 'rating' | 'likes';
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function getParameters(
	params?: ParametersQueryParams,
): Promise<ParametersResponse> {
	const { data } = await api.get<ParametersResponse>('/parameters', {
		params,
	});
	return data ?? { data: [], total: 0 };
}

export async function getParameter(id: string): Promise<LaserParameter> {
	const { data } = await api.get<LaserParameter>(`/parameters/${id}`);
	return data;
}

export interface CreateParameterPayload {
	machine: string;
	powerWatts: number;
	lens: string;
	software: string;
	material: string;
	mode: string;
	speed: number;
	power: number;
	frequency: number;
	line: number;
	crossHatch: number;
	angle: number;
	passes: number;
	passesFill: number;
	notes?: string;
	defocus?: number;
	gas?: boolean;
	isPublic?: boolean;
	materialType?: string;
	thickness?: string;
}

export async function createParameter(
	payload: CreateParameterPayload,
): Promise<LaserParameter> {
	const { data } = await api.post<LaserParameter>('/parameters', payload);
	return data;
}

export async function updateParameter(
	id: string,
	payload: Partial<CreateParameterPayload>,
): Promise<LaserParameter> {
	const { data } = await api.put<LaserParameter>(`/parameters/${id}`, payload);
	return data;
}

export async function deleteParameter(id: string): Promise<void> {
	await api.delete(`/parameters/${id}`);
}

// ─── Community ───────────────────────────────────────────────────────────────

export async function getCommunityParameters(
	params?: CommunityParametersQueryParams,
): Promise<ParametersResponse> {
	const { data } = await api.get<ParametersResponse>('/parameters/community', {
		params,
	});
	return data ?? { data: [], total: 0 };
}

// ─── Stats / Machines / Materials ────────────────────────────────────────────

export async function getParameterStats(): Promise<ParameterStats> {
	const { data } = await api.get<ParameterStats>('/parameters/stats');
	return data;
}

export async function getParameterMachines(): Promise<ParameterMachine[]> {
	const { data } = await api.get<ParameterMachine[]>('/parameters/machines');
	return Array.isArray(data) ? data : [];
}

export async function getParameterMaterials(): Promise<ParameterMaterial[]> {
	const { data } = await api.get<ParameterMaterial[]>('/parameters/materials');
	return Array.isArray(data) ? data : [];
}

// ─── Social: like / rate / save ──────────────────────────────────────────────

export async function likeParameter(id: string): Promise<{ liked: boolean }> {
	const { data } = await api.post<{ liked: boolean }>(`/parameters/${id}/like`);
	return data;
}

export async function rateParameter(id: string, rating: number): Promise<void> {
	await api.post(`/parameters/${id}/rate`, { rating });
}

export async function saveParameter(id: string): Promise<void> {
	await api.post(`/parameters/${id}/save`);
}

export async function unsaveParameter(id: string): Promise<void> {
	await api.delete(`/parameters/${id}/save`);
}

// ─── Export CSV ──────────────────────────────────────────────────────────────

export async function exportParameters(
	params?: ParametersQueryParams,
): Promise<Blob> {
	const { data } = await api.get('/parameters/export', {
		params: { ...params, format: 'csv' },
		responseType: 'blob',
	});
	return data as Blob;
}
