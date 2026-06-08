'use client';

import { useEntitlements } from '@/hooks/use-entitlements';

/**
 * True se o customer logado é uma "conta de teste ilimitada" (tudo
 * desbloqueado, sem cobrança de voxxys). Lê de entitlements (upvox).
 */
export function useIsTestUnlimited(): boolean {
	const { isTestUnlimited } = useEntitlements();
	return isTestUnlimited;
}
