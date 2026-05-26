'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
	blockCustomer,
	deleteCustomer,
	getCustomers,
	setCustomerTestUnlimited,
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

	const testUnlimitedMutation = useMutation({
		mutationFn: ({ id, unlimited }: { id: string; unlimited: boolean }) =>
			setCustomerTestUnlimited(id, unlimited),
		onSuccess: (_data, { unlimited }) => {
			queryClient.invalidateQueries({ queryKey: ['customers'] });
			toast.success(
				unlimited
					? 'Conta marcada como teste ilimitada'
					: 'Conta teste removida',
			);
		},
		onError: () => toast.error('Erro ao atualizar conta teste'),
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
		setTestUnlimited: testUnlimitedMutation.mutateAsync,
		isSettingTestUnlimited: testUnlimitedMutation.isPending,
	};
}
