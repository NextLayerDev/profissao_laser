'use client';

import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { getToken } from '@/lib/auth';
import { getMyPermissions } from '@/services/roles';

/**
 * Permissões efetivas do staff logado (cargo + overrides), vindas de
 * `GET /me/permissions`. Expõe `can(key)` granular e mantém `canAdmin`/
 * `canPrice` por compatibilidade durante o cutover.
 */
export function usePermissions() {
	const hasUserToken = !!getToken('user');

	const { data, isLoading } = useQuery({
		queryKey: ['me-permissions'],
		queryFn: getMyPermissions,
		enabled: hasUserToken,
		staleTime: 5 * 60 * 1000,
	});

	const permSet = useMemo(() => new Set(data?.permissions ?? []), [data]);
	const isSuperAdmin = data?.isSuperAdmin ?? false;

	const can = useCallback(
		(key: string) => (data?.isSuperAdmin ?? false) || permSet.has(key),
		[data, permSet],
	);

	return {
		isSuperAdmin,
		permissions: data?.permissions ?? [],
		can,
		// Back-compat com o modelo binário antigo.
		canAdmin: isSuperAdmin,
		canPrice: isSuperAdmin || permSet.has('produtos.price'),
		isLoading: hasUserToken && isLoading,
	};
}
