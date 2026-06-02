import { api } from '@/lib/fetch';
import type {
	LaserParameter,
	ParameterMachine,
	ParameterMaterial,
	ParameterOption,
	ParameterSidebar,
	ParameterStats,
	ParametersResponse,
	ParameterWithPasses,
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
	software?: string;
	category?: string;
	lens?: string;
	color?: string;
}

export interface CommunityParametersQueryParams extends ParametersQueryParams {
	sort?: 'recent' | 'rating' | 'likes' | 'relevant';
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

/** Receita de uma passada extra (2..N). Sem máquina/material — herdam do pai. */
export interface PassRecipe {
	speed: number;
	power: number;
	frequency: number;
	line: number;
	crossHatch?: boolean;
	angle: number;
	passes: number;
	passesFill: number;
	defocus?: number | null;
	gas?: boolean;
	notes?: string | null;
	tamanhoLinha?: number | null;
	tamanhoDivisao?: number | null;
	sobreposicao?: number | null;
	forcarSeparacao?: boolean | null;
	axisRotative?: boolean | null;
	lineTypeId?: string | null;
	qPulse?: number | null;
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
	crossHatch: boolean;
	/** Ângulo de hachura: null quando não-aplicável (Corte) — espelha o backend. */
	angle: number | null;
	passes: number;
	passesFill: number;
	notes?: string;
	defocus?: number;
	gas?: boolean;
	isPublic?: boolean;
	materialType?: string;
	thickness?: string;
	// Software-specific (Ezcad / Lightburn)
	tamanhoLinha?: number | null;
	tamanhoDivisao?: number | null;
	sobreposicao?: number | null;
	forcarSeparacao?: boolean | null;
	axisRotative?: boolean | null;
	lineTypeId?: string | null;
	imageUrl?: string | null;
	category?: string | null;
	color?: string | null;
	qPulse?: number | null;
	/** Multi-passada: passadas extras (2..N). A passada 1 = recipe acima. */
	extraPasses?: PassRecipe[];
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

/** Sobe a imagem de um parâmetro e devolve a URL (pra setar em imageUrl). */
export async function uploadParameterImage(
	file: File,
): Promise<{ url: string }> {
	const fd = new FormData();
	fd.append('file', file);
	const { data } = await api.post<{ url: string }>('/parameters/image', fd, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
	return data;
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

/** Parâmetro + suas passadas em ordem (pai = passada 1, depois os filhos). */
export async function getParameterPasses(
	id: string,
): Promise<ParameterWithPasses> {
	const { data } = await api.get<ParameterWithPasses>(
		`/parameters/${id}/passes`,
	);
	return data;
}

/** Sidebar: top contribuidores, atividade recente, mais usados. */
export async function getParameterSidebar(): Promise<ParameterSidebar> {
	const { data } = await api.get<ParameterSidebar>('/parameters/sidebar');
	return data;
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

/** Vocabulário (Lente/Tipo/Categoria/Cor) já ordenado, p/ os dropdowns de filtro. */
export async function getParameterOptions(
	dimension: 'lens' | 'category' | 'color' | 'mode',
): Promise<ParameterOption[]> {
	const { data } = await api.get<ParameterOption[]>('/parameters/options', {
		params: { dimension },
	});
	return Array.isArray(data) ? data : [];
}

/** Admin: cria uma opção de vocabulário numa dimensão. */
export async function createParameterOption(body: {
	dimension: string;
	value: string;
	order?: number;
}): Promise<ParameterOption> {
	const { data } = await api.post<ParameterOption>('/parameters/options', body);
	return data;
}

/** Admin: edita value/order/status de uma opção de vocabulário. */
export async function updateParameterOption(
	id: string,
	body: { value?: string; order?: number; status?: 'ativo' | 'inativo' },
): Promise<ParameterOption> {
	const { data } = await api.put<ParameterOption>(
		`/parameters/options/${id}`,
		body,
	);
	return data;
}

/** Admin: remove uma opção de vocabulário. */
export async function deleteParameterOption(id: string): Promise<void> {
	await api.delete(`/parameters/options/${id}`);
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

// ─── Member submission + Admin review ────────────────────────────────────────

/** Membro envia um parâmetro p/ análise (gated por assinatura). Fica pendente. */
export async function submitParameter(
	payload: CreateParameterPayload,
): Promise<LaserParameter> {
	const { data } = await api.post<LaserParameter>(
		'/parameters/submit',
		payload,
	);
	return data;
}

/** Submissões do próprio membro (com status + reviewNote). */
export async function getMySubmissions(): Promise<ParametersResponse> {
	const { data } = await api.get<ParametersResponse>('/parameters/mine');
	return data ?? { data: [], total: 0 };
}

/** Fila de análise do admin (submissões pendentes). */
export async function getPendingParameters(
	params?: ParametersQueryParams,
): Promise<ParametersResponse> {
	const { data } = await api.get<ParametersResponse>('/parameters/pending', {
		params,
	});
	return data ?? { data: [], total: 0 };
}

/** Admin aprova/rejeita uma submissão (rejeição leva um motivo opcional). */
export async function reviewParameter(
	id: string,
	body: { action: 'approve' | 'reject'; reviewNote?: string },
): Promise<LaserParameter> {
	const { data } = await api.post<LaserParameter>(
		`/parameters/${id}/review`,
		body,
	);
	return data;
}
