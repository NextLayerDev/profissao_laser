'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	blockCustomer,
	deleteCustomer,
	getCustomers,
	updateCustomerPassword,
} from '@/services/customer';

export function useCustomers() {
	const queryClient = useQueryClient();

	const {
		data: customers,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['customers'],
		queryFn: getCustomers,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteCustomer(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['customers'] });
		},
	});

	const blockMutation = useMutation({
		mutationFn: ({ id, banned }: { id: string; banned: boolean }) =>
			blockCustomer(id, banned),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['customers'] });
		},
	});

	const changePasswordMutation = useMutation({
		mutationFn: ({ id, password }: { id: string; password: string }) =>
			updateCustomerPassword(id, password),
	});

	return {
		customers: customers ?? [],
		isLoading,
		error,
		deleteCustomer: deleteMutation.mutateAsync,
		isDeleting: deleteMutation.isPending,
		blockCustomer: blockMutation.mutateAsync,
		isBlocking: blockMutation.isPending,
		changePassword: changePasswordMutation.mutateAsync,
		isChangingPassword: changePasswordMutation.isPending,
	};
}
