'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateVectorSupportTicketPayload } from '@/services/vector-support';
import {
	closeVectorSupportTicket,
	createVectorSupportTicket,
	getVectorSupportTicket,
	getVectorSupportTickets,
	getVectorSupportTicketsAdmin,
	sendVectorSupportMessage,
} from '@/services/vector-support';

const QUERY_KEY = ['vector-support'] as const;

// ─── Customer ───────────────────────────────────────────────────────────────

export function useVectorSupportTickets(status?: string, enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'customer', status] as const,
		queryFn: () => getVectorSupportTickets(status),
		enabled,
	});
}

export function useVectorSupportTicket(id: string | null, enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'ticket', id] as const,
		queryFn: () => {
			if (!id) throw new Error('ID required');
			return getVectorSupportTicket(id);
		},
		enabled: !!id && enabled,
	});
}

export function useCreateVectorSupportTicket() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateVectorSupportTicketPayload) =>
			createVectorSupportTicket(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useSendVectorSupportMessage() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			ticketId,
			content,
			files,
		}: {
			ticketId: string;
			content: string;
			files?: File[];
		}) => sendVectorSupportMessage(ticketId, content, files),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

// ─── Admin ──────────────────────────────────────────────────────────────────

export function useVectorSupportTicketsAdmin(status?: string, enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'admin', status] as const,
		queryFn: () => getVectorSupportTicketsAdmin(status),
		enabled,
	});
}

export function useCloseVectorSupportTicket() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => closeVectorSupportTicket(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}
