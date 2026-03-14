'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getFAQs, reactToFAQ, removeReactionFromFAQ } from '@/services/faq';
import type { PLFAQEmoji } from '@/types/faq';

const QUERY_KEY = ['faq'] as const;

export function useFAQs(enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'list'] as const,
		queryFn: getFAQs,
		enabled,
	});
}

export function useReactToFAQ() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ faqId, emoji }: { faqId: string; emoji: PLFAQEmoji }) =>
			reactToFAQ(faqId, emoji),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useRemoveReaction() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (faqId: string) => removeReactionFromFAQ(faqId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}
