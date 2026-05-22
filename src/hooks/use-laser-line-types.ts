'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
	createLaserLineType,
	deleteLaserLineType,
	getLaserLineTypes,
	updateLaserLineType,
} from '@/services/laser-line-types';
import type {
	CreateLaserLineTypePayload,
	LaserLineTypeSoftware,
	UpdateLaserLineTypePayload,
} from '@/types/laser-line-type';

const KEY = (software?: LaserLineTypeSoftware) =>
	['laser-line-types', software ?? 'all'] as const;

export function useLaserLineTypes(software?: LaserLineTypeSoftware) {
	return useQuery({
		queryKey: KEY(software),
		queryFn: () => getLaserLineTypes(software),
		staleTime: 60_000,
	});
}

export function useCreateLaserLineType() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateLaserLineTypePayload) =>
			createLaserLineType(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['laser-line-types'] });
			toast.success('Tipo de linha criado!');
		},
		onError: () => toast.error('Erro ao criar tipo de linha'),
	});
}

export function useUpdateLaserLineType() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: UpdateLaserLineTypePayload;
		}) => updateLaserLineType(id, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['laser-line-types'] });
			toast.success('Tipo de linha atualizado');
		},
		onError: () => toast.error('Erro ao atualizar tipo de linha'),
	});
}

export function useDeleteLaserLineType() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteLaserLineType(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['laser-line-types'] });
			toast.success('Tipo de linha removido');
		},
		onError: () => toast.error('Erro ao remover tipo de linha'),
	});
}
