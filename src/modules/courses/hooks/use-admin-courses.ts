'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import {
	createCourse,
	deleteCourse,
	listAdminCourses,
	listCourses,
	updateCourse,
	uploadCourseImage,
} from '../services/courses.service';

export const coursesQueryKey = ['courses', 'catalog'] as const;

export function useCourses() {
	return useQuery({
		queryKey: coursesQueryKey,
		queryFn: listCourses,
	});
}

import type {
	CreateCoursePayload,
	UpdateCoursePayload,
} from '../types/courses';

export const adminCoursesQueryKey = ['courses', 'admin'] as const;

export function useAdminCourses() {
	return useQuery({
		queryKey: adminCoursesQueryKey,
		queryFn: listAdminCourses,
	});
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
	qc.invalidateQueries({ queryKey: adminCoursesQueryKey });
}

export function useCreateCourse() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateCoursePayload) => createCourse(payload),
		onSuccess: () => {
			invalidate(qc);
			toast.success('Curso criado!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao criar curso')),
	});
}

export function useUpdateCourse() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: UpdateCoursePayload;
		}) => updateCourse(id, payload),
		onSuccess: () => {
			invalidate(qc);
			toast.success('Curso atualizado!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao atualizar curso')),
	});
}

export function useUploadCourseImage() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, file }: { id: string; file: File }) =>
			uploadCourseImage(id, file),
		onSuccess: () => {
			invalidate(qc);
			toast.success('Imagem atualizada!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao enviar imagem')),
	});
}

export function useDeleteCourse() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteCourse(id),
		onSuccess: () => {
			invalidate(qc);
			toast.success('Curso removido!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao remover curso')),
	});
}
