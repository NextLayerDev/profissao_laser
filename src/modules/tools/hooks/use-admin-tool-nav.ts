'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { NavItem } from '@/types/navigation';
import { resolveToolIcon } from '../lib/tool-icons';
import { listToolDefinitions } from '../services/tool-definitions.service';
import { SYSTEM_TOOLS } from '../system-tools';

/**
 * Tools da Fábrica PUBLICADAS que NÃO são de código (não estão em SYSTEM_TOOLS)
 * viram itens dinâmicos no menu do admin, apontando pra página genérica
 * `/course/t/:key`. Assim qualquer tool publicada (ex.: Mentoria) aparece no
 * menu sem hardcode — espelha o `useExtraToolNav` do aluno, mas a fonte aqui é
 * o catálogo de definitions (o admin enxerga tudo, sem depender de assinatura).
 */
export function useAdminToolNav(enabled = true): NavItem[] {
	const { data } = useQuery({
		queryKey: ['tool-definitions'],
		queryFn: listToolDefinitions,
		enabled,
		staleTime: 60_000,
	});

	return useMemo(() => {
		const known = new Set(SYSTEM_TOOLS.map((t) => t.key));
		return (data ?? [])
			.filter((d) => d.status === 'published' && !known.has(d.tool_key))
			.map((d): NavItem => {
				const icon = (d.definition.ui as { icon?: string } | undefined)?.icon;
				return {
					name: d.title,
					icon: resolveToolIcon(icon),
					href: `/course/t/${d.tool_key}`,
					hasDropdown: false,
				};
			});
	}, [data]);
}
