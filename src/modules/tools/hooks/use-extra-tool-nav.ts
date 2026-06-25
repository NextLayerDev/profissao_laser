'use client';

import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useEntitlements } from '@/hooks/use-entitlements';
import type { QuickAccessItem } from '@/utils/constants/quick-access';
import { resolveToolIcon } from '../lib/tool-icons';
import { getToolDefinition } from '../services/tool-definitions.service';
import { SYSTEM_TOOLS } from '../system-tools';
import { TOOL_DEFINITION_KEY } from './use-tool-definition';

/**
 * Tools da Fábrica entituladas que NÃO têm tela própria no código (não estão em
 * `SYSTEM_TOOLS`) viram itens de nav dinâmicos apontando pra página genérica
 * `/course/t/:key`. Assim publicar uma tool nova aparece no menu sem deploy.
 *
 * Para mostrar o ÍCONE que o admin escolheu no builder (`ui.icon`) — e não um
 * martelo fixo —, buscamos a definition publicada de cada tool (endpoint público
 * `GET /v1/tool-definition/:key`) e resolvemos via `resolveToolIcon`, que carrega
 * o ícone lucide de forma lazy (sem inflar o bundle da nav). Martelo é o fallback.
 */
export function useExtraToolNav(): QuickAccessItem[] {
	const { tools } = useEntitlements();

	const extraKeys = useMemo(() => {
		const known = new Set(SYSTEM_TOOLS.map((t) => t.key));
		return tools
			.filter((t) => t.entitled && !known.has(t.key))
			.map((t) => t.key);
	}, [tools]);

	// Uma query por tool (cacheada/dedup com `useToolDefinition`) só pro `ui.icon`.
	const defs = useQueries({
		queries: extraKeys.map((key) => ({
			queryKey: TOOL_DEFINITION_KEY(key),
			queryFn: () => getToolDefinition(key),
			staleTime: 60_000,
		})),
	});

	// `key → ui.icon` em string estável (serve de dependência sem objetos).
	const iconsKey = extraKeys
		.map((key, i) => {
			const icon = (
				defs[i]?.data?.definition.ui as { icon?: string } | undefined
			)?.icon;
			return `${key}:${icon ?? ''}`;
		})
		.join('|');

	return useMemo(() => {
		const iconByKey = new Map(
			iconsKey
				.split('|')
				.filter(Boolean)
				.map((pair) => {
					const idx = pair.indexOf(':');
					return [
						pair.slice(0, idx),
						pair.slice(idx + 1) || undefined,
					] as const;
				}),
		);
		const known = new Set(SYSTEM_TOOLS.map((t) => t.key));
		return tools
			.filter((t) => t.entitled && !known.has(t.key))
			.map(
				(t): QuickAccessItem => ({
					label: t.name,
					description: 'Ferramenta',
					Icon: resolveToolIcon(iconByKey.get(t.key)),
					section: 'FERRAMENTAS',
					href: `/course/t/${t.key}`,
					gradient: 'from-slate-500 to-slate-600',
					iconBg: 'bg-slate-500/15 text-slate-500 dark:text-slate-300',
				}),
			);
	}, [tools, iconsKey]);
}
