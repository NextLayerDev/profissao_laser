'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCustomer } from '@/services/customer';
import type { UpdateCustomerPayload } from '@/types/auth';

export function useUpdateCustomer() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: UpdateCustomerPayload;
		}) => updateCustomer(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['customer'] });
		},
	});
}
