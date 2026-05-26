'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { myVoxesQueryKey } from '@/modules/voxes';
import {
	adjustVox,
	createVoxCheckout,
	createVoxPackage,
	getAllVoxPackages,
	getVoxCosts,
	getVoxHistory,
	getVoxPackages,
	getVoxQuotas,
	setVoxPackageStatus,
	updateVoxCost,
	updateVoxPackage,
} from '@/services/credits';
import type {
	AdjustVoxPayload,
	CreateVoxPackagePayload,
	UpdateVoxPackagePayload,
	VoxFeature,
} from '@/types/credits';

export const VOX_QUOTA_KEY = ['credits', 'quota'] as const;
const COSTS_KEY = ['credits', 'costs'] as const;
const PACKAGES_KEY = ['credits', 'packages'] as const;
const ALL_PACKAGES_KEY = ['credits', 'packages', 'all'] as const;

export function useVoxCosts() {
	return useQuery({
		queryKey: COSTS_KEY,
		queryFn: getVoxCosts,
		staleTime: 5 * 60_000,
	});
}

export function useVoxQuotas(enabled = true) {
	return useQuery({
		queryKey: VOX_QUOTA_KEY,
		queryFn: getVoxQuotas,
		staleTime: 30_000,
		refetchInterval: 60_000,
		enabled,
	});
}

export function useVoxPackages() {
	return useQuery({
		queryKey: PACKAGES_KEY,
		queryFn: getVoxPackages,
	});
}

export function useVoxHistory(page?: number, limit?: number) {
	return useQuery({
		queryKey: ['credits', 'history', page, limit] as const,
		queryFn: () => getVoxHistory({ page, limit }),
	});
}

export function useCreateVoxCheckout() {
	return useMutation({
		mutationFn: (packageId: string) => createVoxCheckout(packageId),
		onSuccess: ({ checkoutUrl }) => {
			window.location.href = checkoutUrl;
		},
		onError: () => toast.error('Erro ao iniciar a compra'),
	});
}

// ─── Admin ──────────────────────────────────────────────────────────────────

export function useAllVoxPackages(enabled = true) {
	return useQuery({
		queryKey: ALL_PACKAGES_KEY,
		queryFn: getAllVoxPackages,
		enabled,
	});
}

export function useCreateVoxPackage() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateVoxPackagePayload) => createVoxPackage(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['credits', 'packages'] });
			toast.success('Pacote criado!');
		},
		onError: () => toast.error('Erro ao criar pacote'),
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
			qc.invalidateQueries({ queryKey: ['credits', 'packages'] });
			toast.success('Pacote atualizado!');
		},
		onError: () => toast.error('Erro ao atualizar pacote'),
	});
}

export function useSetVoxPackageStatus() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, active }: { id: string; active: boolean }) =>
			setVoxPackageStatus(id, active),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['credits', 'packages'] });
			toast.success('Status atualizado!');
		},
		onError: () => toast.error('Erro ao atualizar status'),
	});
}

export function useUpdateVoxCost() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ feature, cost }: { feature: VoxFeature; cost: number }) =>
			updateVoxCost(feature, cost),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: COSTS_KEY });
			toast.success('Custo atualizado!');
		},
		onError: () => toast.error('Erro ao atualizar custo'),
	});
}

export function useAdjustVox() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: AdjustVoxPayload) => adjustVox(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: myVoxesQueryKey });
			toast.success('Saldo ajustado!');
		},
		onError: () => toast.error('Erro ao ajustar saldo'),
	});
}
