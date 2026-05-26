'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import {
	createCourseModule,
	deleteCourseModule,
	listCourseModules,
	updateCourseModule,
} from '../services/modules.service';
import type {
	CreateCourseModulePayload,
	UpdateCourseModulePayload,
} from '../types/modules';

export const courseModulesQueryKey = (slug: string) =>
	['courses', slug, 'modules'] as const;

export function useCourseModules(slug: string) {
	return useQuery({
		queryKey: courseModulesQueryKey(slug),
		queryFn: () => listCourseModules(slug),
		enabled: !!slug,
	});
}

export function useCreateCourseModule(slug: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateCourseModulePayload) =>
			createCourseModule(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: courseModulesQueryKey(slug) });
			toast.success('Módulo criado!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao criar módulo')),
	});
}

export function useUpdateCourseModule(slug: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: UpdateCourseModulePayload;
		}) => updateCourseModule(id, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: courseModulesQueryKey(slug) });
			toast.success('Módulo atualizado!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao atualizar módulo')),
	});
}

export function useDeleteCourseModule(slug: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteCourseModule(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: courseModulesQueryKey(slug) });
			toast.success('Módulo removido!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao remover módulo')),
	});
}
