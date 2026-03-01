'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	deleteLessonMaterial,
	getLessonMaterials,
	uploadLessonMaterial,
} from '@/services/materials';

const key = (lessonId: string) => ['materials', lessonId];

export function useMaterials(lessonId: string) {
	return useQuery({
		queryKey: key(lessonId),
		queryFn: () => getLessonMaterials(lessonId),
		enabled: !!lessonId,
	});
}

export function useUploadMaterial(lessonId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ file, name }: { file: File; name?: string }) =>
			uploadLessonMaterial(lessonId, file, name),
		onSuccess: () => qc.invalidateQueries({ queryKey: key(lessonId) }),
	});
}

export function useDeleteMaterial(lessonId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (materialId: string) =>
			deleteLessonMaterial(lessonId, materialId),
		onSuccess: () => qc.invalidateQueries({ queryKey: key(lessonId) }),
	});
}
