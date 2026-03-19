import { api } from '@/lib/fetch';
import type {
	ChatMessage,
	DefaultQuestion,
	DoubtCategory,
	DoubtChat,
	Technician,
} from '@/types/doubt-chat';

// ─── Categorias ─────────────────────────────────────────────────────────────

export async function getDoubtCategories(): Promise<DoubtCategory[]> {
	const { data } = await api.get<DoubtCategory[]>('/doubt-categories');
	return Array.isArray(data) ? data : [];
}

export interface CreateDoubtCategoryPayload {
	title: string;
	description?: string;
	order: number;
}

export async function createDoubtCategory(
	payload: CreateDoubtCategoryPayload,
): Promise<DoubtCategory> {
	const { data } = await api.post<DoubtCategory>('/doubt-categories', payload);
	return data;
}

export interface UpdateDoubtCategoryPayload {
	title?: string;
	description?: string;
	order?: number;
}

export async function updateDoubtCategory(
	id: string,
	payload: UpdateDoubtCategoryPayload,
): Promise<DoubtCategory> {
	const { data } = await api.patch<DoubtCategory>(
		`/doubt-categories/${id}`,
		payload,
	);
	return data;
}

export async function deleteDoubtCategory(id: string): Promise<void> {
	await api.delete(`/doubt-categories/${id}`);
}

export async function reorderDoubtCategories(
	categoryIds: string[],
): Promise<void> {
	await api.post('/doubt-categories/reorder', { ids: categoryIds });
}

// ─── Técnicos ───────────────────────────────────────────────────────────────

export async function getTechnicians(): Promise<Technician[]> {
	const { data } = await api.get<Technician[]>('/technicians');
	return Array.isArray(data) ? data : [];
}

export async function getTechnician(id: string): Promise<Technician> {
	const { data } = await api.get<Technician>(`/technicians/${id}`);
	return data;
}

// ─── Perguntas padrão ───────────────────────────────────────────────────────

export async function getDefaultQuestions(
	technicianId: string,
): Promise<DefaultQuestion[]> {
	const { data } = await api.get<DefaultQuestion[]>(
		`/technicians/${technicianId}/default-questions`,
	);
	return Array.isArray(data) ? data : [];
}

export interface CreateDefaultQuestionPayload {
	text: string;
	type: 'text' | 'select' | 'textarea';
	options?: string[];
	order: number;
}

export async function createDefaultQuestion(
	technicianId: string,
	payload: CreateDefaultQuestionPayload,
): Promise<DefaultQuestion> {
	const { data } = await api.post<DefaultQuestion>(
		`/technicians/${technicianId}/default-questions`,
		payload,
	);
	return data;
}

export interface UpdateDefaultQuestionPayload {
	text?: string;
	type?: 'text' | 'select' | 'textarea';
	options?: string[];
	order?: number;
}

export async function updateDefaultQuestion(
	id: string,
	payload: UpdateDefaultQuestionPayload,
): Promise<DefaultQuestion> {
	const { data } = await api.patch<DefaultQuestion>(
		`/doubt-default-questions/${id}`,
		payload,
	);
	return data;
}

export async function deleteDefaultQuestion(id: string): Promise<void> {
	await api.delete(`/doubt-default-questions/${id}`);
}

export async function reorderDefaultQuestions(
	technicianId: string,
	questionIds: string[],
): Promise<void> {
	await api.post(`/technicians/${technicianId}/default-questions/reorder`, {
		ids: questionIds,
	});
}

// ─── Chats (cliente) ─────────────────────────────────────────────────────────

export type DoubtChatStatus = 'pending' | 'answered' | 'all';

export async function getDoubtChats(
	status: DoubtChatStatus = 'all',
): Promise<DoubtChat[]> {
	const params = status !== 'all' ? `?status=${status}` : '';
	const { data } = await api.get<DoubtChat[]>(`/doubt-chats${params}`);
	return Array.isArray(data) ? data : [];
}

export interface CreateDoubtChatPayload {
	categoryId: string;
	technicianId?: string;
	qualificationAnswers?: Record<string, string>;
	initialMessage: string;
	file?: File;
}

export async function createDoubtChat(
	payload: CreateDoubtChatPayload,
): Promise<DoubtChat> {
	const fd = new FormData();
	fd.append('categoryId', payload.categoryId);
	fd.append('initialMessage', payload.initialMessage);
	if (payload.technicianId) fd.append('technicianId', payload.technicianId);
	if (payload.qualificationAnswers)
		fd.append(
			'qualificationAnswers',
			JSON.stringify(payload.qualificationAnswers),
		);
	if (payload.file) fd.append('file', payload.file);
	const { data } = await api.post<DoubtChat>('/doubt-chats', fd);
	return data;
}

export async function getDoubtChat(id: string): Promise<DoubtChat> {
	const { data } = await api.get<DoubtChat>(`/doubt-chats/${id}`);
	return data;
}

export async function sendDoubtChatMessage(
	chatId: string,
	content: string,
	file?: File,
): Promise<ChatMessage> {
	const fd = new FormData();
	if (content) fd.append('content', content);
	if (file) fd.append('file', file);
	const { data } = await api.post<ChatMessage>(
		`/doubt-chats/${chatId}/messages`,
		fd,
	);
	return data;
}

export async function assignRandomTechnician(
	chatId: string,
): Promise<DoubtChat> {
	const { data } = await api.post<DoubtChat>(
		`/doubt-chats/${chatId}/assign-random`,
	);
	return data;
}

// ─── Chats (admin) ─────────────────────────────────────────────────────────

export async function getDoubtChatsAdmin(
	categoryId?: string,
): Promise<DoubtChat[]> {
	const params = categoryId ? `?categoryId=${categoryId}` : '';
	const { data } = await api.get<DoubtChat[]>(`/doubt-chats/admin${params}`);
	return Array.isArray(data) ? data : [];
}
