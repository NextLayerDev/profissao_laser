'use client';

import { useQuery } from '@tanstack/react-query';
import { getToken } from '@/lib/auth';
import { getMeUnlimited } from '@/services/credits';

/**
 * True se o customer logado é uma "conta de teste ilimitada"
 * (tudo desbloqueado, voxes infinitos). Só consulta quando há token de
 * customer; para admin/sem login retorna false.
 */
export function useIsTestUnlimited(): boolean {
	const { data } = useQuery({
		queryKey: ['me', 'unlimited'] as const,
		queryFn: getMeUnlimited,
		staleTime: 5 * 60_000,
		enabled: typeof window !== 'undefined' && !!getToken('customer'),
	});
	return data?.unlimited === true;
}
