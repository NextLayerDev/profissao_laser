'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	createFAQ,
	deleteFAQ,
	getFAQs,
	reorderFAQs,
	updateFAQ,
} from '@/services/faq';
import type { CreateFAQPayload, UpdateFAQPayload } from '@/types/faq';

const QUERY_KEY = ['faq-admin'] as const;

export function useFAQsAdmin(enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'list'] as const,
		queryFn: getFAQs,
		enabled,
	});
}

export function useCreateFAQ() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateFAQPayload) => createFAQ(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			qc.invalidateQueries({ queryKey: ['faq'] });
		},
	});
}

export function useUpdateFAQ() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: UpdateFAQPayload }) =>
			updateFAQ(id, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			qc.invalidateQueries({ queryKey: ['faq'] });
		},
	});
}

export function useDeleteFAQ() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteFAQ(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			qc.invalidateQueries({ queryKey: ['faq'] });
		},
	});
}

export function useReorderFAQs() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (faqIds: string[]) => reorderFAQs(faqIds),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
			qc.invalidateQueries({ queryKey: ['faq'] });
		},
	});
}
