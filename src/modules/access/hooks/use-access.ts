'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { getCurrentUser, getToken } from '@/lib/auth';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import {
	createPermissionModule,
	createRole,
	deletePermissionModule,
	deleteRole,
	getMyPermissions,
	getPermissionCatalog,
	getRoles,
	getUserAccess,
	updatePermissionModule,
	updateRole,
	updateUserAccess,
} from '../services/access.service';
import type {
	PermissionModulePayload,
	RolePayload,
	UserAccessPayload,
} from '../types/access';

/**
 * Permissões efetivas do usuário logado, vindas de `GET /v1/me/permissions`.
 * Mantém a assinatura usada pelos consumidores (`can`, `canPrice`, `canAdmin`,
 * `isSuperAdmin`, `permissions`, `isLoading`).
 */
export function usePermissions() {
	const user = getCurrentUser();
	const userId = user?.sub;
	const hasUserToken = !!getToken('user');

	const { data, isLoading } = useQuery({
		queryKey: ['me-permissions', userId],
		queryFn: getMyPermissions,
		enabled: hasUserToken && !!userId,
		staleTime: 5 * 60 * 1000,
	});

	const isSuperAdmin = !!data?.isSuperAdmin;
	const permissions = data?.permissions ?? [];

	const can = useCallback(
		(key: string) => isSuperAdmin || permissions.includes(key),
		[isSuperAdmin, permissions],
	);

	return {
		isSuperAdmin,
		permissions,
		can,
		canAdmin: isSuperAdmin,
		canPrice: isSuperAdmin || permissions.includes('planos.price'),
		isLoading: hasUserToken && !!userId && isLoading,
	};
}

export function usePermissionCatalog(enabled = true) {
	return useQuery({
		queryKey: ['permission-catalog'],
		queryFn: getPermissionCatalog,
		enabled,
		staleTime: 30 * 60 * 1000,
	});
}

/**
 * Gestão do catálogo de módulos de permissão (CRUD). Compartilha a query
 * `['permission-catalog']` com `usePermissionCatalog`, então criar/editar/excluir
 * um módulo atualiza também a matriz de cargos.
 */
export function usePermissionModules(enabled = true) {
	const queryClient = useQueryClient();
	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: ['permission-catalog'] });

	const { data: modules = [], isLoading } = useQuery({
		queryKey: ['permission-catalog'],
		queryFn: getPermissionCatalog,
		enabled,
		staleTime: 30 * 60 * 1000,
	});

	const createMutation = useMutation({
		mutationFn: (payload: PermissionModulePayload) =>
			createPermissionModule(payload),
		onSuccess: () => {
			invalidate();
			toast.success('Módulo criado!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao criar módulo')),
	});

	const updateMutation = useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: Partial<PermissionModulePayload>;
		}) => updatePermissionModule(id, payload),
		onSuccess: () => {
			invalidate();
			toast.success('Módulo atualizado!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao atualizar módulo')),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deletePermissionModule(id),
		onSuccess: () => {
			invalidate();
			toast.success('Módulo excluído!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao excluir módulo')),
	});

	return {
		modules,
		isLoading,
		createModule: createMutation.mutateAsync,
		updateModule: updateMutation.mutateAsync,
		deleteModule: deleteMutation.mutateAsync,
		isMutating:
			createMutation.isPending ||
			updateMutation.isPending ||
			deleteMutation.isPending,
	};
}

export function useRoles(enabled = true) {
	const queryClient = useQueryClient();
	const invalidate = () => {
		queryClient.invalidateQueries({ queryKey: ['roles'] });
		queryClient.invalidateQueries({ queryKey: ['me-permissions'] });
	};

	const { data: roles = [], isLoading } = useQuery({
		queryKey: ['roles'],
		queryFn: getRoles,
		enabled,
	});

	const createMutation = useMutation({
		mutationFn: (payload: RolePayload) => createRole(payload),
		onSuccess: () => {
			invalidate();
			toast.success('Cargo criado!');
		},
		// Surface o motivo do backend: key duplicada (409) ou grant inválido (400).
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao criar cargo')),
	});

	const updateMutation = useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: Partial<RolePayload>;
		}) => updateRole(id, payload),
		onSuccess: () => {
			invalidate();
			toast.success('Cargo atualizado!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao atualizar cargo')),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteRole(id),
		onSuccess: () => {
			invalidate();
			toast.success('Cargo excluído!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao excluir cargo')),
	});

	return {
		roles,
		isLoading,
		createRole: createMutation.mutateAsync,
		updateRole: updateMutation.mutateAsync,
		deleteRole: deleteMutation.mutateAsync,
		isMutating:
			createMutation.isPending ||
			updateMutation.isPending ||
			deleteMutation.isPending,
	};
}

/** Acesso atribuído (cargo + overrides) de um usuário, para o modal de edição. */
export function useUserAccess(userId: string | null) {
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: ['user-access', userId],
		queryFn: () => getUserAccess(userId as string),
		enabled: !!userId,
	});

	const mutation = useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: UserAccessPayload }) =>
			updateUserAccess(id, payload),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ['user-access', id] });
			toast.success('Acesso atualizado!');
		},
		onError: () => toast.error('Erro ao atualizar acesso'),
	});

	return {
		access: query.data ?? null,
		isLoading: query.isLoading,
		updateAccess: mutation.mutateAsync,
		isSaving: mutation.isPending,
	};
}
