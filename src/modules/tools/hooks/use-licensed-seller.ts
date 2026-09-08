'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import {
	aceitarTermo,
	addCanal,
	type Declaracao,
	getDeclaracao,
	listVendedores,
	removeCanal,
} from '../services/licensed-seller.service';

export const declaracaoQueryKey = ['licensed-seller'] as const;

export function useDeclaracao() {
	return useQuery<Declaracao>({
		queryKey: declaracaoQueryKey,
		queryFn: getDeclaracao,
		staleTime: 30_000,
	});
}

export function useAddCanal() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: addCanal,
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: declaracaoQueryKey });
		},
		onError: (e) =>
			toast.error(
				getApiErrorMessage(e, 'Não foi possível salvar o canal de venda.'),
			),
	});
}

export function useRemoveCanal() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: removeCanal,
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: declaracaoQueryKey });
		},
		onError: (e) =>
			toast.error(getApiErrorMessage(e, 'Não foi possível tirar o canal.')),
	});
}

export function useAceitarTermo() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: aceitarTermo,
		onSuccess: (d) => {
			qc.setQueryData(declaracaoQueryKey, d);
			toast.success('Declaração registrada.');
		},
		onError: (e) =>
			toast.error(
				getApiErrorMessage(e, 'Não foi possível registrar o aceite.'),
			),
	});
}

export const vendedoresQueryKey = (featureKey?: string) =>
	['licensed-sellers', featureKey ?? 'todas'] as const;

/** Staff: quem declarou o quê. Com marca, só quem gerou peça dela. */
export function useVendedores(featureKey?: string) {
	return useQuery({
		queryKey: vendedoresQueryKey(featureKey),
		queryFn: () => listVendedores(featureKey),
	});
}
