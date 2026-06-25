'use client';

import { useMemo } from 'react';
import type { NavItem } from '@/types/navigation';
import { usePinnedTools } from './use-pinned-tools';
import { useToolCatalog } from './use-tool-catalog';

/**
 * `NavItem` do admin enriquecido com a `section` (id da topologia do admin) que
 * a tool herda da categoria — a sidebar usa pra agrupar os pinados em seções
 * colapsáveis. Aditivo sobre `NavItem`, então segue compatível com quem só lê
 * `name/icon/href/hasDropdown`.
 */
export interface AdminToolNavItem extends NavItem {
	/** Id da seção (topologia admin) — vem da categoria da tool. */
	section: string;
	/** Key da tool (pra casar com o store de pins). */
	toolKey: string;
}

/**
 * Itens do menu do admin: SÓ as ferramentas PINADAS. O catálogo completo
 * (`useToolCatalog('admin')`) e o toggle de pin (`usePinnedTools('admin')`)
 * vivem no hub/⌘K; aqui só intersectamos os dois. Sem nada salvo, o default são
 * as 3 primeiras por ordem (usuário novo não fica com o menu vazio).
 *
 * Mantém o tipo de retorno como lista de `NavItem` (com `section`/`toolKey`
 * extras) pra sidebar existente continuar consumindo sem quebra.
 */
export function useAdminToolNav(enabled = true): AdminToolNavItem[] {
	const { tools } = useToolCatalog('admin');

	const defaults = useMemo(() => tools.slice(0, 3).map((t) => t.key), [tools]);
	const { pins, isReady } = usePinnedTools('admin', defaults);

	return useMemo(() => {
		if (!enabled) return [];
		// note: antes de hidratar os pins, mostra os defaults pra não piscar vazio.
		const active = isReady ? pins : defaults;
		const pinned = new Set(active);
		return tools
			.filter((t) => pinned.has(t.key))
			.map(
				(t): AdminToolNavItem => ({
					name: t.title,
					icon: t.Icon,
					href: t.href,
					hasDropdown: false,
					section: t.section,
					toolKey: t.key,
				}),
			);
	}, [enabled, tools, pins, isReady, defaults]);
}
