import { api } from '@/shared/lib/fetch';
import type {
	VectorSupportMessage,
	VectorSupportTicket,
} from '@/types/vector-support';

// ─── Customer ───────────────────────────────────────────────────────────────

export async function getVectorSupportTickets(
	status?: string,
): Promise<VectorSupportTicket[]> {
	const params = status ? `?status=${status}` : '';
	const { data } = await api.get<VectorSupportTicket[]>(
		`/vector-support/tickets${params}`,
	);
	return Array.isArray(data) ? data : [];
}

export async function getVectorSupportTicket(
	id: string,
): Promise<VectorSupportTicket> {
	const { data } = await api.get<VectorSupportTicket>(
		`/vector-support/tickets/${id}`,
	);
	return data;
}

export interface CreateVectorSupportTicketPayload {
	subject: string;
	initialMessage: string;
	files?: File[];
}

export async function createVectorSupportTicket(
	payload: CreateVectorSupportTicketPayload,
): Promise<VectorSupportTicket> {
	const fd = new FormData();
	fd.append('subject', payload.subject);
	fd.append('initialMessage', payload.initialMessage);
	if (payload.files) {
		for (const file of payload.files) {
			fd.append('files', file);
		}
	}
	const { data } = await api.post<VectorSupportTicket>(
		'/vector-support/tickets',
		fd,
	);
	return data;
}

export async function sendVectorSupportMessage(
	ticketId: string,
	content: string,
	files?: File[],
): Promise<VectorSupportMessage> {
	const fd = new FormData();
	if (content) fd.append('content', content);
	if (files) {
		for (const file of files) {
			fd.append('files', file);
		}
	}
	const { data } = await api.post<VectorSupportMessage>(
		`/vector-support/tickets/${ticketId}/messages`,
		fd,
	);
	return data;
}

// ─── Admin ──────────────────────────────────────────────────────────────────

export async function getVectorSupportTicketsAdmin(
	status?: string,
): Promise<VectorSupportTicket[]> {
	const params = status ? `?status=${status}` : '';
	const { data } = await api.get<VectorSupportTicket[]>(
		`/vector-support/tickets/admin${params}`,
	);
	return Array.isArray(data) ? data : [];
}

export async function closeVectorSupportTicket(id: string): Promise<void> {
	await api.post(`/vector-support/tickets/${id}/close`);
}
