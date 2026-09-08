'use client';

import { useQuery } from '@tanstack/react-query';
import { getPublicPackage, getPublicPackages } from '@/services/packages';

/** Vitrine pública de pacotes (cada um já vem com seu curso e suas tools). */
export function usePackages() {
	return useQuery({
		queryKey: ['packages'],
		queryFn: getPublicPackages,
		staleTime: 5 * 60 * 1000,
		retry: 1,
	});
}

/** Página de compra de um pacote. */
export function usePackage(key: string) {
	return useQuery({
		queryKey: ['package', key],
		queryFn: () => getPublicPackage(key),
		enabled: !!key,
		staleTime: 5 * 60 * 1000,
		retry: 1,
	});
}
