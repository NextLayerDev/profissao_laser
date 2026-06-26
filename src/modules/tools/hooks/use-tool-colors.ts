'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { categoryColor } from '@/modules/tools/lib/tool-categories';
import { listToolColors } from '@/modules/tools/services/tool-definitions.service';
import { TOOL_COLORS, type ToolColorKey } from '@/utils/constants/tool-colors';

/**
 * Cor RESOLVIDA por `tool_key` (a `ui.color` própria; na ausência, a cor da
 * categoria) — pra uma feature do aluno HERDAR a cor da tool admin
 * correspondente. Fonte: o endpoint leve `/v1/tool-definitions/colors` (qualquer
 * status, só cor/categoria). Recolorir no board reflete aqui.
 */
export function useToolColorByKey(): Map<string, ToolColorKey> {
	const { data } = useQuery({
		queryKey: ['tool-colors'],
		queryFn: listToolColors,
		staleTime: 60_000,
	});
	return useMemo(() => {
		const map = new Map<string, ToolColorKey>();
		for (const r of data ?? []) {
			const own =
				r.color && r.color in TOOL_COLORS
					? (r.color as ToolColorKey)
					: undefined;
			map.set(r.tool_key, own ?? categoryColor(r.category ?? undefined));
		}
		return map;
	}, [data]);
}
