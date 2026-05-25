'use client';

import { useMutation } from '@tanstack/react-query';
import { forgotPassword } from '../services/auth.service';
import type { ForgotPasswordPayload } from '../types/auth';

export function useForgotPassword() {
	return useMutation({
		mutationFn: (payload: ForgotPasswordPayload) => forgotPassword(payload),
	});
}
