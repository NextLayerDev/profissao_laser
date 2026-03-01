'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	addProductToClass,
	type CreateClassPayload,
	createClass,
	deleteClass,
	getClasses,
	removeProductFromClass,
	type UpdateClassPayload,
	updateClass,
} from '@/services/classes';

export function useClasses() {
	const { data, error, isLoading } = useQuery({
		queryKey: ['classes'],
		queryFn: getClasses,
	});

	return { classes: data ?? [], error, isLoading };
}

export function useCreateClass() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateClassPayload) => createClass(payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
	});
}

export function useUpdateClass() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: UpdateClassPayload;
		}) => updateClass(id, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
	});
}

export function useDeleteClass() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteClass(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
	});
}

export function useAddProductToClass() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			classId,
			productId,
		}: {
			classId: string;
			productId: string;
		}) => addProductToClass(classId, productId),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
	});
}

export function useRemoveProductFromClass() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			classId,
			productId,
		}: {
			classId: string;
			productId: string;
		}) => removeProductFromClass(classId, productId),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
	});
}
