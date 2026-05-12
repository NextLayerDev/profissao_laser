'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
	CreateKnowledgeBasePayload,
	KnowledgeBaseParams,
} from '@/services/knowledge-base';
import {
	createKnowledgeBaseArticle,
	deleteKnowledgeBaseArticle,
	getKnowledgeBase,
	getKnowledgeBaseArticle,
	updateKnowledgeBaseArticle,
} from '@/services/knowledge-base';

const QUERY_KEY = ['knowledge-base'] as const;

export function useKnowledgeBase(params?: KnowledgeBaseParams, enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, params] as const,
		queryFn: () => getKnowledgeBase(params),
		enabled,
	});
}

export function useKnowledgeBaseArticle(id: string | null, enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'article', id] as const,
		queryFn: () => {
			if (!id) throw new Error('ID required');
			return getKnowledgeBaseArticle(id);
		},
		enabled: !!id && enabled,
	});
}

export function useCreateKnowledgeBaseArticle() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateKnowledgeBasePayload) =>
			createKnowledgeBaseArticle(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useUpdateKnowledgeBaseArticle() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: Partial<CreateKnowledgeBasePayload>;
		}) => updateKnowledgeBaseArticle(id, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useDeleteKnowledgeBaseArticle() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteKnowledgeBaseArticle(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}
