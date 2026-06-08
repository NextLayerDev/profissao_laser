'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteColaborador, updateColaborador } from '@/services/colaboradores';
import { getUsers } from '@/services/users';
import type { UpdateUserPayload } from '@/types/users';

export function useUsers(enabled = true) {
	const queryClient = useQueryClient();

	const {
		data: users,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['users'],
		queryFn: getUsers,
		// Usuários mudam devagar — cacheia p/ não rebuscar todos a cada troca de
		// canal no chat (que monta o mapa de exibição a partir desta lista).
		staleTime: 5 * 60 * 1000,
		enabled,
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
			updateColaborador(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users'] });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: deleteColaborador,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users'] });
		},
	});

	return {
		users: users ?? [],
		isLoading,
		error,
		updateUser: updateMutation.mutateAsync,
		deleteUser: deleteMutation.mutateAsync,
		isUpdating: updateMutation.isPending,
		isDeleting: deleteMutation.isPending,
	};
}
