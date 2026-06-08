'use client';

import { useCallback } from 'react';
import { getToken } from '@/lib/auth';
import { useMe } from '@/modules/account';

/**
 * Durante o cutover para a API de cursos, o modelo granular de permissões
 * (`GET /me/permissions` da API antiga) deixou de valer: a API de cursos só
 * expõe o `role` (customer | staff | admin) via `GET /v1/me`. Aqui derivamos
 * o acesso a partir desse role — admin/staff têm acesso total ao painel — e
 * mantemos a mesma interface (`can`, `canPrice`, `canAdmin`, `isSuperAdmin`)
 * para não quebrar os consumidores.
 */
const PANEL_ROLES = ['admin', 'staff'];

export function usePermissions() {
	const hasUserToken = !!getToken('user');

	const { data: me, isLoading } = useMe(hasUserToken);

	const isSuperAdmin = !!me && PANEL_ROLES.includes(me.role);

	// Mantém a assinatura (key: string) => boolean dos consumidores; sob o novo
	// modelo, quem é admin/staff pode tudo, então a chave é ignorada.
	const can = useCallback((_key: string) => isSuperAdmin, [isSuperAdmin]);

	return {
		isSuperAdmin,
		permissions: [] as string[],
		can,
		// Back-compat com o modelo binário antigo.
		canAdmin: isSuperAdmin,
		canPrice: isSuperAdmin,
		isLoading: hasUserToken && isLoading,
	};
}
