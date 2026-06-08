'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import {
	deleteMaterial,
	listLessonMaterials,
	uploadLessonMaterial,
} from '../services/lessons.service';

export const lessonMaterialsQueryKey = (lessonId: string) =>
	['lessons', lessonId, 'materials'] as const;

export function useLessonMaterials(lessonId: string, enabled = true) {
	return useQuery({
		queryKey: lessonMaterialsQueryKey(lessonId),
		queryFn: () => listLessonMaterials(lessonId),
		enabled: enabled && !!lessonId,
	});
}

export function useUploadLessonMaterial(lessonId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (file: File) => uploadLessonMaterial(lessonId, file),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: lessonMaterialsQueryKey(lessonId) });
			toast.success('Material enviado!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao enviar material')),
	});
}

export function useDeleteMaterial(lessonId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteMaterial(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: lessonMaterialsQueryKey(lessonId) });
			toast.success('Material removido!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao remover material')),
	});
}
