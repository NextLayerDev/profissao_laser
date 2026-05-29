'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import {
	changeMyPassword,
	getMe,
	getMyStreak,
	updateMe,
} from '../services/account.service';
import type { ChangePasswordPayload, UpdateMePayload } from '../types/account';

export const accountQueryKeys = {
	me: ['account', 'me'] as const,
	streak: ['account', 'streak'] as const,
};

export function useMe(enabled = true) {
	return useQuery({
		queryKey: accountQueryKeys.me,
		queryFn: getMe,
		enabled,
	});
}

export function useMyStreak(enabled = true) {
	return useQuery({
		queryKey: accountQueryKeys.streak,
		queryFn: getMyStreak,
		enabled,
	});
}

export function useUpdateMe() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: UpdateMePayload) => updateMe(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: accountQueryKeys.me });
			toast.success('Perfil atualizado!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao atualizar perfil')),
	});
}

export function useChangeMyPassword() {
	return useMutation({
		mutationFn: (payload: ChangePasswordPayload) => changeMyPassword(payload),
		onSuccess: () => toast.success('Senha alterada!'),
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao alterar senha')),
	});
}
