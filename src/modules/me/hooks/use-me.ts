'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getToken } from '@/shared/lib/auth';
import { getMe, updateMe } from '../services/me.service';

export const meQueryKey = ['me'] as const;

export function useMe() {
	return useQuery({
		queryKey: meQueryKey,
		queryFn: getMe,
		enabled: typeof window !== 'undefined' && !!getToken(),
		staleTime: 5 * 60 * 1000,
		retry: false,
	});
}

export function useIsAdmin() {
	const { data } = useMe();
	return data?.role === 'admin' || data?.role === 'staff';
}

export function useUpdateMe() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: updateMe,
		onSuccess: (me) => qc.setQueryData(meQueryKey, me),
	});
}
