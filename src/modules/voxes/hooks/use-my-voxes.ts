'use client';

import { useQuery } from '@tanstack/react-query';
import { getActiveToken } from '@/lib/auth';
import { getMyVoxes } from '../services/voxes.service';

export const myVoxesQueryKey = ['voxes', 'me'] as const;

/**
 * Query do saldo + ledger do usuário.
 * `pollUntilBalanceAbove` ativa polling rápido (2s) até o saldo subir além
 * do valor passado — útil na página de retorno do checkout Stripe.
 */
export function useMyVoxes(options?: { pollUntilBalanceAbove?: number }) {
	const target = options?.pollUntilBalanceAbove;
	return useQuery({
		queryKey: myVoxesQueryKey,
		queryFn: getMyVoxes,
		enabled: typeof window !== 'undefined' && !!getActiveToken(),
		refetchInterval: (query) => {
			if (target === undefined) return false;
			const balance = query.state.data?.balance ?? 0;
			return balance > target ? false : 2000;
		},
	});
}
