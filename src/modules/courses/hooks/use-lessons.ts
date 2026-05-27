'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import {
	createLesson,
	deleteLesson,
	listModuleLessons,
	updateLesson,
	uploadLessonVideo,
} from '../services/lessons.service';
import type {
	CreateLessonPayload,
	UpdateLessonPayload,
} from '../types/lessons';

export const moduleLessonsQueryKey = (moduleId: string) =>
	['modules', moduleId, 'lessons'] as const;

export function useModuleLessons(moduleId: string, enabled = true) {
	return useQuery({
		queryKey: moduleLessonsQueryKey(moduleId),
		queryFn: () => listModuleLessons(moduleId),
		enabled: enabled && !!moduleId,
	});
}

export function useCreateLesson(moduleId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateLessonPayload) => createLesson(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: moduleLessonsQueryKey(moduleId) });
			toast.success('Lição criada!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao criar lição')),
	});
}

export function useUpdateLesson(moduleId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: UpdateLessonPayload;
		}) => updateLesson(id, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: moduleLessonsQueryKey(moduleId) });
			toast.success('Lição atualizada!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao atualizar lição')),
	});
}

export function useUploadLessonVideo(moduleId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			file,
			onProgress,
		}: {
			id: string;
			file: File;
			onProgress?: (percent: number) => void;
		}) => uploadLessonVideo(id, file, onProgress),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: moduleLessonsQueryKey(moduleId) });
			toast.success('Vídeo enviado!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao enviar vídeo')),
	});
}

export function useDeleteLesson(moduleId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteLesson(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: moduleLessonsQueryKey(moduleId) });
			toast.success('Lição removida!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao remover lição')),
	});
}
