'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { resetPassword } from '../services/auth.service';
import type { ResetPasswordPayload } from '../types/auth';

export function useResetPassword() {
	const router = useRouter();
	return useMutation({
		mutationFn: (payload: ResetPasswordPayload) => resetPassword(payload),
		onSuccess: () => router.push('/login'),
	});
}
