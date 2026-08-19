'use client';

import { useQuery } from '@tanstack/react-query';
import { listMyLicensedArt } from '../services/my-licensed-art.service';

export const myLicensedArtQueryKey = ['my-licensed-art'] as const;

export function useMyLicensedArt(enabled = true) {
	return useQuery({
		queryKey: myLicensedArtQueryKey,
		queryFn: listMyLicensedArt,
		enabled,
		// Sem repetição: um 401 aqui derruba a sessão pelo interceptor do `api`.
		// Tentar de novo só multiplica o estrago antes do redirect.
		retry: false,
	});
}
