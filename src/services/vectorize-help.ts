import { api } from '@/lib/fetch';
import type {
	CreateVectorizeHelpPayload,
	UpdateVectorizeHelpPayload,
	VectorizeHelpItem,
} from '@/types/vectorize-help';

// ─── Normalizador snake_case → camelCase ────────────────────────────────────

// biome-ignore lint/suspicious/noExplicitAny: raw API response
function normalizeItem(raw: any): VectorizeHelpItem {
	return {
		id: raw.id,
		title: raw.title,
		description: raw.description,
		icon: raw.icon,
		type: raw.type,
		content: raw.content ?? null,
		videoUrl: raw.video_url ?? raw.videoUrl ?? null,
		order: raw.order ?? 0,
		active: raw.active ?? true,
		createdAt: raw.created_at ?? raw.createdAt ?? '',
		updatedAt: raw.updated_at ?? raw.updatedAt ?? '',
	};
}

function toApiPayload(
	payload: Record<string, unknown>,
): Record<string, unknown> {
	const out: Record<string, unknown> = { ...payload };
	if ('videoUrl' in out) {
		out.video_url = out.videoUrl;
		delete out.videoUrl;
	}
	return out;
}

// ─── CRUD ───────────────────────────────────────────────────────────────────

export async function getVectorizeHelpItems(): Promise<VectorizeHelpItem[]> {
	const { data } = await api.get('/vectorize-help');
	return Array.isArray(data) ? data.map(normalizeItem) : [];
}

export async function getActiveVectorizeHelpItems(): Promise<
	VectorizeHelpItem[]
> {
	const { data } = await api.get('/vectorize-help/active');
	return Array.isArray(data) ? data.map(normalizeItem) : [];
}

export async function getVectorizeHelpItem(
	id: string,
): Promise<VectorizeHelpItem> {
	const { data } = await api.get(`/vectorize-help/${id}`);
	return normalizeItem(data);
}

export async function createVectorizeHelpItem(
	payload: CreateVectorizeHelpPayload,
): Promise<VectorizeHelpItem> {
	const { data } = await api.post(
		'/vectorize-help',
		toApiPayload(payload as unknown as Record<string, unknown>),
	);
	return normalizeItem(data);
}

export async function updateVectorizeHelpItem(
	id: string,
	payload: UpdateVectorizeHelpPayload,
): Promise<VectorizeHelpItem> {
	const { data } = await api.patch(
		`/vectorize-help/${id}`,
		toApiPayload(payload as unknown as Record<string, unknown>),
	);
	return normalizeItem(data);
}

export async function deleteVectorizeHelpItem(id: string): Promise<void> {
	await api.delete(`/vectorize-help/${id}`);
}

export async function reorderVectorizeHelpItems(ids: string[]): Promise<void> {
	await api.post('/vectorize-help/reorder', { ids });
}
