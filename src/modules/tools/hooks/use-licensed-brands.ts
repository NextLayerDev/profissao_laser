'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import * as service from '../services/licensed-brand.service';

export const licensedBrandsQueryKey = ['licensed-brands'] as const;

export function useLicensedBrands() {
	return useQuery({
		queryKey: licensedBrandsQueryKey,
		queryFn: service.listLicensedBrands,
	});
}

export function useSaveLicensedBrand() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			...input
		}: service.SalvarMarcaInput & { id?: string }) =>
			id
				? service.updateLicensedBrand(id, input)
				: service.createLicensedBrand(input),
		onSuccess: (_d, vars) => {
			qc.invalidateQueries({ queryKey: licensedBrandsQueryKey });
			toast.success(vars.id ? 'Marca atualizada' : 'Marca cadastrada');
		},
		onError: (e) =>
			toast.error(getApiErrorMessage(e, 'Não foi possível salvar a marca.')),
	});
}

export function useDeleteLicensedBrand() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: service.deleteLicensedBrand,
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: licensedBrandsQueryKey });
			toast.success('Marca removida');
		},
		onError: (e) =>
			toast.error(getApiErrorMessage(e, 'Não foi possível remover a marca.')),
	});
}
