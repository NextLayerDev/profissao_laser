'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { saveToken } from '@/lib/auth';
import {
	loginCustomer,
	loginUser,
	registerCustomer,
	registerUser,
} from '@/services/auth';
import type {
	LoginCustomerPayload,
	LoginUserPayload,
	RegisterCustomerPayload,
	RegisterUserPayload,
} from '@/types/auth';

export function useLoginCustomer() {
	const router = useRouter();
	return useMutation({
		mutationFn: (payload: LoginCustomerPayload) => loginCustomer(payload),
		onSuccess: ({ token }) => {
			saveToken('customer', token);
			router.push('/store');
		},
	});
}

export function useRegisterCustomer() {
	const router = useRouter();
	return useMutation({
		mutationFn: (payload: RegisterCustomerPayload) => registerCustomer(payload),
		onSuccess: () => {
			router.push('/login');
		},
	});
}

export function useLoginUser() {
	const router = useRouter();
	return useMutation({
		mutationFn: (payload: LoginUserPayload) => loginUser(payload),
		onSuccess: ({ token }) => {
			saveToken('user', token);
			router.push('/');
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
