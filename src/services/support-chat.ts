import { api } from '@/lib/fetch';
import type {
	SupportChat,
	SupportChatStatus,
	SupportChatSummary,
} from '@/types/support-chat';

// ── Customer ──────────────────────────────────────────────────────────────

export async function createSupportChat(
	message?: string,
): Promise<SupportChat> {
	const { data } = await api.post<SupportChat>(
		'/support-chats',
		message ? { message } : {},
	);
	return data;
}

export async function getSupportChat(id: string): Promise<SupportChat> {
	const { data } = await api.get<SupportChat>(`/support-chats/${id}`);
	return data;
}

export async function listSupportChats(): Promise<SupportChatSummary[]> {
	const { data } = await api.get<SupportChatSummary[]>('/support-chats');
	return Array.isArray(data) ? data : [];
}

export async function sendSupportMessage(
	id: string,
	content: string,
): Promise<SupportChat> {
	const { data } = await api.post<SupportChat>(
		`/support-chats/${id}/messages`,
		{
			content,
		},
	);
	return data;
}

export async function requestHuman(id: string): Promise<SupportChat> {
	const { data } = await api.post<SupportChat>(
		`/support-chats/${id}/request-human`,
	);
	return data;
}

export async function closeSupportChat(id: string): Promise<SupportChat> {
	const { data } = await api.post<SupportChat>(`/support-chats/${id}/close`);
	return data;
}

// ── Admin ─────────────────────────────────────────────────────────────────

export async function listAdminSupportChats(
	status?: SupportChatStatus,
): Promise<SupportChatSummary[]> {
	const { data } = await api.get<SupportChatSummary[]>('/support-chats/admin', {
		params: status ? { status } : {},
	});
	return Array.isArray(data) ? data : [];
}

export async function getAdminSupportChat(id: string): Promise<SupportChat> {
	const { data } = await api.get<SupportChat>(`/support-chats/admin/${id}`);
	return data;
}

export async function adminSendSupportMessage(
	id: string,
	content: string,
): Promise<SupportChat> {
	const { data } = await api.post<SupportChat>(
		`/support-chats/admin/${id}/messages`,
		{ content },
	);
	return data;
}

export async function takeOverSupportChat(id: string): Promise<SupportChat> {
	const { data } = await api.post<SupportChat>(
		`/support-chats/admin/${id}/take-over`,
	);
	return data;
}

export async function adminCloseSupportChat(id: string): Promise<SupportChat> {
	const { data } = await api.post<SupportChat>(
		`/support-chats/admin/${id}/close`,
	);
	return data;
}
