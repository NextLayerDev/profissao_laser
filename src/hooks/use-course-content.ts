'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	type CreateLessonPayload,
	type CreateModulePayload,
	createLesson,
	createModule,
	deleteLesson,
	deleteModule,
	getLessons,
	getModules,
	type UpdateLessonPayload,
	type UpdateModulePayload,
	updateLesson,
	updateModule,
} from '@/services/modules';

const key = (productId: string) => ['course-content', productId];

export function useCourseContent(productId: string) {
	return useQuery({
		queryKey: key(productId),
		queryFn: async () => {
			const modules = await getModules(productId);
			return Promise.all(
				modules.map(async (mod) => ({
					...mod,
					lessons: await getLessons(mod.id),
				})),
			);
		},
		enabled: !!productId,
	});
}

export function useCreateModule(productId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateModulePayload) => createModule(payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: key(productId) }),
	});
}

export function useUpdateModule(productId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: UpdateModulePayload;
		}) => updateModule(id, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: key(productId) }),
	});
}

export function useDeleteModule(productId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteModule(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: key(productId) }),
	});
}

export function useCreateLesson(productId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateLessonPayload) => createLesson(payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: key(productId) }),
	});
}

export function useUpdateLesson(productId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: UpdateLessonPayload;
		}) => updateLesson(id, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: key(productId) }),
	});
}

export function useDeleteLesson(productId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteLesson(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: key(productId) }),
	});
}
