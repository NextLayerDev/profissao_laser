'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	createVectorizeHelpItem,
	deleteVectorizeHelpItem,
	getActiveVectorizeHelpItems,
	getVectorizeHelpItems,
	reorderVectorizeHelpItems,
	updateVectorizeHelpItem,
} from '@/services/vectorize-help';
import type {
	CreateVectorizeHelpPayload,
	UpdateVectorizeHelpPayload,
} from '@/types/vectorize-help';

const QUERY_KEY = ['vectorize-help'] as const;

export function useVectorizeHelp(enabled = true) {
	return useQuery({
		queryKey: QUERY_KEY,
		queryFn: getVectorizeHelpItems,
		enabled,
	});
}

export function useVectorizeHelpActive(enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'active'] as const,
		queryFn: getActiveVectorizeHelpItems,
		enabled,
	});
}

export function useCreateVectorizeHelp() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateVectorizeHelpPayload) =>
			createVectorizeHelpItem(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useUpdateVectorizeHelp() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: UpdateVectorizeHelpPayload;
		}) => updateVectorizeHelpItem(id, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useDeleteVectorizeHelp() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteVectorizeHelpItem(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useReorderVectorizeHelp() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (ids: string[]) => reorderVectorizeHelpItems(ids),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}
