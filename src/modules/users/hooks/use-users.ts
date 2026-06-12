'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import {
	demoteUser,
	getUser,
	listTeamUsers,
	listUsers,
	promoteUser,
	setUserBlocked,
	setUserPassword,
	updateUserRole,
} from '../services/users.service';
import type { ListUsersParams, UserRole } from '../types/users';

export const usersQueryKeys = {
	all: ['users'] as const,
	list: (params: ListUsersParams) => ['users', 'list', params] as const,
	team: () => ['users', 'team'] as const,
	detail: (id: string) => ['users', 'detail', id] as const,
};

export function useUsers(params: ListUsersParams = {}) {
	return useQuery({
		queryKey: usersQueryKeys.list(params),
		queryFn: () => listUsers(params),
	});
}

export function useTeamUsers() {
	return useQuery({
		queryKey: usersQueryKeys.team(),
		queryFn: listTeamUsers,
	});
}

export function useUser(id: string) {
	return useQuery({
		queryKey: usersQueryKeys.detail(id),
		queryFn: () => getUser(id),
		enabled: !!id,
	});
}

function useInvalidateUsers() {
	const qc = useQueryClient();
	return () => qc.invalidateQueries({ queryKey: usersQueryKeys.all });
}

export function useUpdateUserRole() {
	const invalidate = useInvalidateUsers();
	return useMutation({
		mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
			updateUserRole(id, role),
		onSuccess: () => {
			invalidate();
			toast.success('Função atualizada!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao atualizar função')),
	});
}

export function useSetUserBlocked() {
	const invalidate = useInvalidateUsers();
	return useMutation({
		mutationFn: ({ id, blocked }: { id: string; blocked: boolean }) =>
			setUserBlocked(id, blocked),
		onSuccess: (_, { blocked }) => {
			invalidate();
			toast.success(blocked ? 'Usuário bloqueado.' : 'Usuário desbloqueado.');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao alterar bloqueio')),
	});
}

export function useSetUserPassword() {
	return useMutation({
		mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
			setUserPassword(id, newPassword),
		onSuccess: () => toast.success('Senha alterada!'),
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao alterar senha')),
	});
}

export function usePromoteUser() {
	const invalidate = useInvalidateUsers();
	return useMutation({
		mutationFn: ({
			id,
			role,
		}: {
			id: string;
			role: Extract<UserRole, 'staff' | 'admin'>;
		}) => promoteUser(id, role),
		onSuccess: () => {
			invalidate();
			toast.success('Usuário promovido!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao promover usuário')),
	});
}

export function useDemoteUser() {
	const invalidate = useInvalidateUsers();
	return useMutation({
		mutationFn: ({
			id,
			role,
		}: {
			id: string;
			role: Extract<UserRole, 'customer' | 'staff'>;
		}) => demoteUser(id, role),
		onSuccess: () => {
			invalidate();
			toast.success('Usuário rebaixado!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao rebaixar usuário')),
	});
}
