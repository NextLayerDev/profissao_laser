'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
	createRole,
	deleteRole,
	getPermissionCatalog,
	getRoles,
	updateRole,
} from '@/services/roles';
import type { RolePayload } from '@/types/roles';

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
		onError: () => toast.error('Erro ao criar cargo'),
	});

	const updateMutation = useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: number;
			payload: Partial<RolePayload>;
		}) => updateRole(id, payload),
		onSuccess: () => {
			invalidate();
			toast.success('Cargo atualizado!');
		},
		onError: () => toast.error('Erro ao atualizar cargo'),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => deleteRole(id),
		onSuccess: () => {
			invalidate();
			toast.success('Cargo excluído!');
		},
		onError: (err: unknown) => {
			const msg =
				(err as { response?: { data?: { message?: string } } })?.response?.data
					?.message ?? 'Erro ao excluir cargo';
			toast.error(msg);
		},
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

export function usePermissionCatalog(enabled = true) {
	return useQuery({
		queryKey: ['permission-catalog'],
		queryFn: getPermissionCatalog,
		enabled,
		staleTime: 30 * 60 * 1000,
	});
}
