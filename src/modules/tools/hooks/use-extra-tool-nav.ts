'use client';

import { useMemo } from 'react';
import type { QuickAccessItem } from '@/utils/constants/quick-access';
import { TOOL_COLORS } from '@/utils/constants/tool-colors';
import { usePinnedTools } from './use-pinned-tools';
import { useToolCatalog } from './use-tool-catalog';

/**
 * Itens de nav do ALUNO para tools da Fábrica: SÓ as PINADAS. A fonte gateada é
 * `useToolCatalog('student')` (entitlements + def por key); aqui só intersecta
 * com os pins (`usePinnedTools('student')`). O catálogo inteiro fica no hub/⌘K.
 *
 * O `section` vem da categoria da tool (não mais 'FERRAMENTAS' fixo) e a cor sai
 * da paleta única `TOOL_COLORS` pela chave que a categoria define — então cada
 * tool fica visualmente coerente com o resto da home. Sem pins salvos, default =
 * 3 primeiras por ordem.
 */
export function useExtraToolNav(): QuickAccessItem[] {
	const { tools } = useToolCatalog('student');

	const defaults = useMemo(() => tools.slice(0, 3).map((t) => t.key), [tools]);
	const { pins, isReady } = usePinnedTools('student', defaults);

	return useMemo(() => {
		const active = isReady ? pins : defaults;
		const pinned = new Set(active);
		return tools
			.filter((t) => pinned.has(t.key))
			.map((t): QuickAccessItem => {
				const palette = TOOL_COLORS[t.color];
				// note: `section` da categoria é string; QuickAccessItem só aceita as 3
				// canônicas — categorias do aluno sempre caem numa delas, mas damos um
				// fallback defensivo pra FERRAMENTAS.
				const section = (
					t.section === 'CONTEUDO' ||
					t.section === 'COMUNIDADE' ||
					t.section === 'FERRAMENTAS'
						? t.section
						: 'FERRAMENTAS'
				) as QuickAccessItem['section'];
				return {
					label: t.title,
					description: t.description ?? 'Ferramenta',
					Icon: t.Icon,
					section,
					href: t.href,
					gradient: palette.gradient,
					iconBg: palette.iconBg,
				};
			});
	}, [tools, pins, isReady, defaults]);
}
