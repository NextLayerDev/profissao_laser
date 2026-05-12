import { api } from '@/lib/fetch';
import type { KnowledgeBaseArticle } from '@/types/knowledge-base';

export interface KnowledgeBaseParams {
	category?: string;
	type?: 'article' | 'video';
	search?: string;
}

export async function getKnowledgeBase(
	params?: KnowledgeBaseParams,
): Promise<KnowledgeBaseArticle[]> {
	const { data } = await api.get<KnowledgeBaseArticle[]>('/knowledge-base', {
		params,
	});
	return Array.isArray(data) ? data : [];
}

export async function getKnowledgeBaseArticle(
	id: string,
): Promise<KnowledgeBaseArticle> {
	const { data } = await api.get<KnowledgeBaseArticle>(`/knowledge-base/${id}`);
	return data;
}

export interface CreateKnowledgeBasePayload {
	title: string;
	type: 'article' | 'video';
	content?: string;
	excerpt?: string;
	videoUrl?: string;
	readTime?: number;
	icon?: string;
	category?: string;
	isPublished?: boolean;
	order?: number;
}

export async function createKnowledgeBaseArticle(
	payload: CreateKnowledgeBasePayload,
): Promise<KnowledgeBaseArticle> {
	const { data } = await api.post<KnowledgeBaseArticle>(
		'/knowledge-base',
		payload,
	);
	return data;
}

export async function updateKnowledgeBaseArticle(
	id: string,
	payload: Partial<CreateKnowledgeBasePayload>,
): Promise<KnowledgeBaseArticle> {
	const { data } = await api.patch<KnowledgeBaseArticle>(
		`/knowledge-base/${id}`,
		payload,
	);
	return data;
}

export async function deleteKnowledgeBaseArticle(id: string): Promise<void> {
	await api.delete(`/knowledge-base/${id}`);
}
