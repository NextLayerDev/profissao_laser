import { api } from '@/lib/fetch';
import type {
	CreateFAQPayload,
	PLFAQ,
	PLFAQEmoji,
	UpdateFAQPayload,
} from '@/types/faq';

// ─── Normalizador snake_case → camelCase ────────────────────────────────────

// biome-ignore lint/suspicious/noExplicitAny: raw API response
function normalizeFAQ(raw: any): PLFAQ {
	const imageUrl =
		raw.image_url ??
		raw.imageUrl ??
		raw.image ??
		raw.fileUrl ??
		raw.file_url ??
		raw.file ??
		raw.url ??
		null;

	return {
		id: raw.id,
		question: raw.question,
		answer: raw.answer,
		imageUrl: typeof imageUrl === 'string' ? imageUrl : null,
		reactions: Array.isArray(raw.reactions) ? raw.reactions : [],
		userReaction: raw.user_reaction ?? raw.userReaction ?? null,
		order: raw.order ?? 0,
		createdAt: raw.created_at ?? raw.createdAt ?? '',
		updatedAt: raw.updated_at ?? raw.updatedAt ?? '',
	};
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildFormData(payload: {
	question?: string;
	answer?: string;
	order?: number;
	file?: File;
}): FormData {
	const fd = new FormData();
	if (payload.question !== undefined) fd.append('question', payload.question);
	if (payload.answer !== undefined) fd.append('answer', payload.answer);
	if (payload.order !== undefined) fd.append('order', String(payload.order));
	if (payload.file) fd.append('image', payload.file);
	return fd;
}

// ─── CRUD ───────────────────────────────────────────────────────────────────

export async function getFAQs(): Promise<PLFAQ[]> {
	const { data } = await api.get('/faqs');
	return Array.isArray(data) ? data.map(normalizeFAQ) : [];
}

export async function createFAQ(payload: CreateFAQPayload): Promise<PLFAQ> {
	const { data } = await api.post('/faqs', buildFormData(payload));
	return normalizeFAQ(data);
}

export async function updateFAQ(
	id: string,
	payload: UpdateFAQPayload,
): Promise<PLFAQ> {
	const { data } = await api.patch(`/faqs/${id}`, buildFormData(payload));
	return normalizeFAQ(data);
}

export async function deleteFAQ(id: string): Promise<void> {
	await api.delete(`/faqs/${id}`);
}

// ─── Reorder ────────────────────────────────────────────────────────────────

export async function reorderFAQs(faqIds: string[]): Promise<void> {
	await api.post('/faqs/reorder', { ids: faqIds });
}

// ─── Reações ────────────────────────────────────────────────────────────────

export async function reactToFAQ(
	faqId: string,
	emoji: PLFAQEmoji,
): Promise<PLFAQ> {
	const { data } = await api.post(`/faqs/${faqId}/react`, { emoji });
	return normalizeFAQ(data);
}

export async function removeReactionFromFAQ(faqId: string): Promise<PLFAQ> {
	const { data } = await api.delete(`/faqs/${faqId}/react`);
	return normalizeFAQ(data);
}
