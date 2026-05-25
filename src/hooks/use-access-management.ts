'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	blockUser,
	changeUserPassword,
	demoteUser,
	getUsersFiltered,
	promoteUser,
} from '@/services/users';

export const ACCESS_QUERY_KEY = ['users-access'] as const;

export function useAccessUsers() {
	return useQuery({
		queryKey: ACCESS_QUERY_KEY,
		queryFn: () => getUsersFiltered(),
		staleTime: 30_000,
	});
}

export function parseApiError(err: unknown): string {
	const code =
		(err as { response?: { data?: { code?: string } } })?.response?.data
			?.code ?? '';
	if (code === 'cannot_change_own_role')
		return 'Você não pode alterar o próprio cargo.';
	if (code === 'role_not_higher_than_current')
		return 'O cargo escolhido não é superior ao atual.';
	if (code === 'role_not_lower_than_current')
		return 'O cargo escolhido não é inferior ao atual.';
	if (code === 'wrong_current_password') return 'Senha atual incorreta.';
	if (code === 'password_change_failed') return 'Falha ao atualizar a senha.';
	if (code === 'not_found') return 'Usuário não encontrado.';
	return 'Erro inesperado. Tente novamente.';
}

export function usePromoteUser() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, role }: { id: string; role: 'staff' | 'admin' }) =>
			promoteUser(id, role),
		onSuccess: () => qc.invalidateQueries({ queryKey: ACCESS_QUERY_KEY }),
	});
}

export function useDemoteUser() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, role }: { id: string; role: 'staff' | 'customer' }) =>
			demoteUser(id, role),
		onSuccess: () => qc.invalidateQueries({ queryKey: ACCESS_QUERY_KEY }),
	});
}

export function useBlockUser() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, blocked }: { id: string; blocked: boolean }) =>
			blockUser(id, blocked),
		onSuccess: () => qc.invalidateQueries({ queryKey: ACCESS_QUERY_KEY }),
	});
}

export function useChangeUserPassword() {
	return useMutation({
		mutationFn: ({ id, new_password }: { id: string; new_password: string }) =>
			changeUserPassword(id, new_password),
	});
}
