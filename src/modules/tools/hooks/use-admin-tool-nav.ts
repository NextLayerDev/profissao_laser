'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { NavItem } from '@/types/navigation';
import { resolveToolIcon } from '../lib/tool-icons';
import { listToolDefinitions } from '../services/tool-definitions.service';
import { SYSTEM_TOOLS } from '../system-tools';

/**
 * Tools de CÓDIGO (SYSTEM_TOOLS) que também queremos no menu do admin. Cada uma
 * aponta pra uma rota admin que REUSA a tela da ferramenta — aditivo, sem mexer
 * no funcionamento dela (motor/cobrança/página do cliente seguem iguais).
 */
const ADMIN_CODE_TOOLS: { name: string; icon: string; href: string }[] = [
	{
		name: 'Gravação 1-Clique',
		icon: 'flame',
		href: '/ferramentas/gravacao-oneclick',
	},
];

/**
 * Itens do menu do admin para ferramentas: (1) tools de código curadas
 * (ADMIN_CODE_TOOLS) + (2) tools da Fábrica PUBLICADAS que NÃO são de código
 * (não estão em SYSTEM_TOOLS), apontando pra página de gestão. Assim qualquer
 * tool publicada (ex.: Mentoria) aparece sem hardcode, e as de código que
 * quisermos (Gravação 1-Clique) também — espelha o `useExtraToolNav` do aluno,
 * mas a fonte aqui é o catálogo de definitions (admin enxerga tudo).
 */
export function useAdminToolNav(enabled = true): NavItem[] {
	const { data } = useQuery({
		queryKey: ['tool-definitions'],
		queryFn: listToolDefinitions,
		enabled,
		staleTime: 60_000,
	});

	return useMemo(() => {
		if (!enabled) return [];
		const code = ADMIN_CODE_TOOLS.map(
			(t): NavItem => ({
				name: t.name,
				icon: resolveToolIcon(t.icon),
				href: t.href,
				hasDropdown: false,
			}),
		);
		const known = new Set(SYSTEM_TOOLS.map((t) => t.key));
		const published = (data ?? [])
			.filter((d) => d.status === 'published' && !known.has(d.tool_key))
			.map((d): NavItem => {
				const icon = (d.definition.ui as { icon?: string } | undefined)?.icon;
				// Sala (room_v1) OU tool com Banco do Admin → tela dedicada de gestão
				// (admin alimenta o banco); pipeline sem banco → editor no builder.
				const href =
					d.engine_runtime === 'room_v1' || d.definition.bank?.enabled
						? `/ferramentas/t/${d.tool_key}`
						: `/ferramentas?open=${d.id}`;
				return {
					name: d.title,
					icon: resolveToolIcon(icon),
					href,
					hasDropdown: false,
				};
			});
		return [...code, ...published];
	}, [data, enabled]);
}
