'use client';

import { Wrench } from 'lucide-react';
import { useMemo } from 'react';
import { useEntitlements } from '@/hooks/use-entitlements';
import type { QuickAccessItem } from '@/utils/constants/quick-access';
import { SYSTEM_TOOLS } from '../system-tools';

/**
 * Tools da Fábrica entituladas que NÃO têm tela própria no código (não estão em
 * `SYSTEM_TOOLS`) viram itens de nav dinâmicos apontando pra página genérica
 * `/course/t/:key`. Assim publicar uma tool nova aparece no menu sem deploy.
 */
export function useExtraToolNav(): QuickAccessItem[] {
	const { tools } = useEntitlements();

	return useMemo(() => {
		const known = new Set(SYSTEM_TOOLS.map((t) => t.key));
		return tools
			.filter((t) => t.entitled && !known.has(t.key))
			.map(
				(t): QuickAccessItem => ({
					label: t.name,
					description: 'Ferramenta',
					Icon: Wrench,
					section: 'FERRAMENTAS',
					href: `/course/t/${t.key}`,
					gradient: 'from-slate-500 to-slate-600',
					iconBg: 'bg-slate-500/15 text-slate-500 dark:text-slate-300',
				}),
			);
	}, [tools]);
}
