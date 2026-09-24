'use client';

import { useMemo } from 'react';
import type { QuickAccessItem } from '@/utils/constants/quick-access';
import { TOOL_COLORS } from '@/utils/constants/tool-colors';
import { usePinnedTools } from './use-pinned-tools';
import { useToolCatalog } from './use-tool-catalog';

/**
 * Itens de nav do ALUNO para tools da Fábrica: as PINADAS. A fonte gateada das
 * tools é `useToolCatalog('student')` (entitlements + def por key); aqui só
 * intersecta com os pins (`usePinnedTools('student')`). O catálogo inteiro fica
 * no hub/⌘K.
 *
 * ┌─ "MINHA MARCA" SAIU DAQUI ──────────────────────────────────────────────┐
 * │ Havia um item FIXO apontando para `/course/minha-marca`, gateado por     │
 * │ `useMarcaDisponivel()`. Ele saiu porque o cadastro da marca virou uma    │
 * │ SEÇÃO DO PERFIL — o pedido do dono foi literal: "não quero como          │
 * │ ferramenta". Deixá-lo em FERRAMENTAS depois de mover a tela criaria dois │
 * │ endereços para o mesmo cadastro (a rota antiga hoje só redireciona).     │
 * │                                                                          │
 * │ Efeito colateral bom, e medido: `useMarcaDisponivel()` rodava a CADA     │
 * │ render de sidebar/home só para decidir esconder um item de menu — para   │
 * │ quem está fora da allowlist isso era um 404 mais uma retentativa por     │
 * │ page-load. Agora a pergunta só é feita onde ela importa: no perfil.      │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * O `section` vem da categoria da tool (não mais 'FERRAMENTAS' fixo) e a cor sai
 * da paleta única `TOOL_COLORS` pela chave que a categoria define — então cada
 * tool fica visualmente coerente com o resto da home. Sem pins salvos, default =
 * 3 primeiras por ordem.
 */
/** Coage a `section` (string da categoria) numa das 3 do QuickAccessItem. */
function toQuickSection(section: string): QuickAccessItem['section'] {
	return section === 'CONTEUDO' ||
		section === 'COMUNIDADE' ||
		section === 'FERRAMENTAS'
		? section
		: 'FERRAMENTAS';
}

/**
 * TODAS as tools da Fábrica disponíveis ao ALUNO (publicadas + com direito +
 * audiência), já com a COR configurada (cor da categoria OU `ui.color` própria).
 * Diferente de `useExtraToolNav` (só as PINADAS): a home do aluno mostra todas —
 * toda tool publicada aparece com a cor definida no board/builder.
 */
export function useStudentToolItems(): QuickAccessItem[] {
	const { tools } = useToolCatalog('student');
	return useMemo(
		() =>
			tools.map((t): QuickAccessItem => {
				const palette = TOOL_COLORS[t.color];
				return {
					label: t.title,
					description: t.description ?? 'Ferramenta',
					Icon: t.Icon,
					section: toQuickSection(t.section),
					href: t.href,
					gradient: palette.gradient,
					iconBg: palette.iconBg,
				};
			}),
		[tools],
	);
}

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
