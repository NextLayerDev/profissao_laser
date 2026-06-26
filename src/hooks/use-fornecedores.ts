import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	createFornecedor,
	deleteFornecedor,
	listFornecedores,
	updateFornecedor,
} from '@/services/fornecedores';
import type {
	CreateFornecedorBody,
	UpdateFornecedorBody,
} from '@/types/fornecedor';

const QUERY_KEY = ['fornecedores'] as const;

export function useFornecedores() {
	return useQuery({
		queryKey: QUERY_KEY,
		queryFn: listFornecedores,
	});
}

export function useCreateFornecedor() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (body: CreateFornecedorBody) => createFornecedor(body),
		onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
	});
}

export function useUpdateFornecedor() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: UpdateFornecedorBody }) =>
			updateFornecedor(id, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
	});
}

export function useDeleteFornecedor() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteFornecedor(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
	});
}
