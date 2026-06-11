'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { saveRefreshToken, saveToken } from '@/lib/auth';
import { registerUser } from '@/services/auth';
import { loginCourses, signupCourses } from '@/services/courses-auth';
import type {
	LoginCustomerPayload,
	RegisterCustomerPayload,
	RegisterUserPayload,
} from '@/types/auth';

/** Roles que acessam o painel administrativo (token de "user"). */
const PANEL_ROLES = ['admin', 'staff'];

/**
 * Login único: a API de cursos retorna o role do usuário (customer | admin |
 * staff) e roteamos de acordo. admin/staff vão para o painel (token "user");
 * customer vai para a área de aluno (token "customer").
 */
export function useLogin() {
	const router = useRouter();
	return useMutation({
		mutationFn: (payload: LoginCustomerPayload) => loginCourses(payload),
		onSuccess: ({ accessToken, refreshToken, user }) => {
			if (refreshToken) saveRefreshToken(refreshToken);
			if (PANEL_ROLES.includes(user?.role ?? '')) {
				saveToken('user', accessToken);
				router.push('/dashboard');
			} else {
				saveToken('customer', accessToken);
				router.push('/course');
			}
		},
	});
}

export function useRegisterCustomer() {
	const router = useRouter();
	return useMutation({
		mutationFn: (payload: RegisterCustomerPayload) => signupCourses(payload),
		onSuccess: ({ accessToken, refreshToken, user }) => {
			if (refreshToken) saveRefreshToken(refreshToken);
			if (PANEL_ROLES.includes(user?.role ?? '')) {
				saveToken('user', accessToken);
				router.push('/dashboard');
			} else {
				saveToken('customer', accessToken);
				router.push('/course');
			}
		},
	});
}

export function useRegisterUser() {
	const router = useRouter();
	return useMutation({
		mutationFn: (payload: RegisterUserPayload) => registerUser(payload),
		onSuccess: () => {
			router.push('/login');
		},
	});
}
