'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	createSystemClass,
	deleteSystemClass,
	getSystemClass,
	getSystemClasses,
	linkClass,
	linkProduct,
	unlinkClass,
	unlinkProduct,
	updateSystemClass,
} from '@/services/system-classes';
import type {
	CreateSystemClassPayload,
	UpdateSystemClassPayload,
} from '@/types/system-classes';

const QUERY_KEY = ['system-classes'];

export function useSystemClasses() {
	const { data, error, isLoading } = useQuery({
		queryKey: QUERY_KEY,
		queryFn: getSystemClasses,
		staleTime: 5 * 60 * 1000,
	});

	return { systemClasses: data ?? [], error, isLoading };
}

export function useSystemClass(id: string | null) {
	const { data, error, isLoading } = useQuery({
		queryKey: [...QUERY_KEY, id],
		queryFn: () => getSystemClass(id!),
		enabled: !!id,
	});

	return { systemClass: data ?? null, error, isLoading };
}

export function useCreateSystemClass() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateSystemClassPayload) =>
			createSystemClass(payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
	});
}

export function useUpdateSystemClass() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: UpdateSystemClassPayload;
		}) => updateSystemClass(id, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
	});
}

export function useDeleteSystemClass() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteSystemClass(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
	});
}

export function useLinkProduct() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, productId }: { id: string; productId: string }) =>
			linkProduct(id, productId),
		onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
	});
}

export function useUnlinkProduct() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, productId }: { id: string; productId: string }) =>
			unlinkProduct(id, productId),
		onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
	});
}

export function useLinkClass() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, classId }: { id: string; classId: string }) =>
			linkClass(id, classId),
		onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
	});
}

export function useUnlinkClass() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, classId }: { id: string; classId: string }) =>
			unlinkClass(id, classId),
		onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
	});
}
