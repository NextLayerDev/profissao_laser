'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import {
	createVoxPackage,
	listAllVoxPackages,
	updateVoxPackage,
} from '../services/voxes.service';
import type {
	CreateVoxPackagePayload,
	UpdateVoxPackagePayload,
} from '../types/voxes';
import { voxPackagesQueryKey } from './use-vox-packages';

export const allVoxPackagesQueryKey = ['voxes', 'packages', 'all'] as const;

export function useAllVoxPackages(enabled = true) {
	return useQuery({
		queryKey: allVoxPackagesQueryKey,
		queryFn: listAllVoxPackages,
		enabled,
	});
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
	qc.invalidateQueries({ queryKey: allVoxPackagesQueryKey });
	qc.invalidateQueries({ queryKey: voxPackagesQueryKey });
}

export function useCreateVoxPackage() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateVoxPackagePayload) => createVoxPackage(payload),
		onSuccess: () => {
			invalidateAll(qc);
			toast.success('Pacote criado!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao criar pacote')),
	});
}

export function useUpdateVoxPackage() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: UpdateVoxPackagePayload;
		}) => updateVoxPackage(id, payload),
		onSuccess: () => {
			invalidateAll(qc);
			toast.success('Pacote atualizado!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao atualizar pacote')),
	});
}

/**
 * Não existe DELETE no endpoint v1 — "remover" é PATCH com published=false.
 */
export function useSetVoxPackagePublished() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, published }: { id: string; published: boolean }) =>
			updateVoxPackage(id, { published }),
		onSuccess: (_, { published }) => {
			invalidateAll(qc);
			toast.success(published ? 'Pacote publicado!' : 'Pacote despublicado!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao atualizar status')),
	});
}
