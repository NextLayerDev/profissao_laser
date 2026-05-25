'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { meQueryKey } from '@/modules/me';
import { saveToken } from '@/shared/lib/auth';
import { login } from '../services/auth.service';
import type { LoginPayload } from '../types/auth';

export function useLogin() {
	const router = useRouter();
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (payload: LoginPayload) => {
			const { access_token, user } = await login(payload);
			saveToken(access_token);
			qc.setQueryData(meQueryKey, user);
			return user;
		},
		onSuccess: (user) => {
			const isAdmin = user.role === 'admin' || user.role === 'staff';
			router.push(isAdmin ? '/dashboard' : '/course');
		},
	});
}
