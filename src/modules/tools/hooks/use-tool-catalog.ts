'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useEntitlements } from '@/hooks/use-entitlements';
import { usePermissions } from '@/modules/access';
import type { ToolColorKey } from '@/utils/constants/tool-colors';
import { categoryColor, categoryToSection } from '../lib/tool-categories';
import { resolveToolIcon } from '../lib/tool-icons';
import {
	type AiToolDefinition,
	getToolDefinition,
	listToolDefinitions,
} from '../services/tool-definitions.service';
import { SYSTEM_TOOLS } from '../system-tools';
import { TOOL_DEFINITION_KEY } from './use-tool-definition';

/**
 * O ÚNICO catálogo de ferramentas da Fábrica já GATEADO por público. Tudo que
 * decide "esta tool aparece pra este usuário?" mora AQUI — a sidebar, o hub e o
 * ⌘K consomem o resultado pronto. Admin e aluno têm fontes diferentes (lista de
 * definitions vs entitlements), então o hook ramifica internamente e devolve o
 * mesmo shape (`CatalogTool[]`).
 *
 * Cada tool carrega já resolvidos: ícone (lucide lazy via `ui.icon`), categoria
 * → seção (topologia do público) e cor (paleta única). Ordena por `ui.order`
 * (ausente = 999) e depois título.
 */

export type ToolAudience = 'both' | 'admin' | 'student';

export interface CatalogTool {
	key: string;
	title: string;
	description?: string;
	Icon: LucideIcon;
	/** Id da categoria declarada (`ui.category`) ou `outros`. */
	category: string;
	/** Seção da sidebar/hub no público pedido (derivada da categoria). */
	section: string;
	/** Ordem dentro da seção (`ui.order` ?? 999). */
	order: number;
	/** Chave da paleta `TOOL_COLORS` herdada da categoria. */
	color: ToolColorKey;
	href: string;
	audience: ToolAudience;
}

/**
 * Tools de CÓDIGO (em `SYSTEM_TOOLS`, tela própria) que ainda queremos no
 * catálogo do admin — reusam a rota admin dedicada. Espelha o antigo
 * `ADMIN_CODE_TOOLS`, agora com categoria (`producao`) pra cair na seção certa.
 */
const ADMIN_CODE_TOOLS: {
	key: string;
	title: string;
	icon: string;
	href: string;
	category: string;
}[] = [
	{
		key: 'gravacao_oneclick_admin',
		title: 'Gravação 1-Clique',
		icon: 'flame',
		href: '/ferramentas/gravacao-oneclick',
		category: 'producao',
	},
];

type ToolUi = {
	icon?: string;
	category?: string;
	order?: number;
	audience?: ToolAudience;
};

function readUi(def: AiToolDefinition | undefined): ToolUi {
	return (def?.definition.ui ?? {}) as ToolUi;
}

/** Ordena por `order` e desempata por título (estável). */
function sortTools(a: CatalogTool, b: CatalogTool): number {
	if (a.order !== b.order) return a.order - b.order;
	return a.title.localeCompare(b.title);
}

export interface UseToolCatalog {
	tools: CatalogTool[];
	isLoading: boolean;
}

/* ── Admin: lista de definitions (admin enxerga tudo) ── */
function useAdminCatalog(): UseToolCatalog {
	const { isSuperAdmin } = usePermissions();
	const enabled = isSuperAdmin;

	const { data, isLoading } = useQuery({
		queryKey: ['tool-definitions'],
		queryFn: listToolDefinitions,
		enabled,
		staleTime: 60_000,
	});

	const tools = useMemo<CatalogTool[]>(() => {
		if (!enabled) return [];
		const known = new Set(SYSTEM_TOOLS.map((t) => t.key));

		const code = ADMIN_CODE_TOOLS.map(
			(t): CatalogTool => ({
				key: t.key,
				title: t.title,
				description: undefined,
				Icon: resolveToolIcon(t.icon),
				category: t.category,
				section: categoryToSection(t.category, 'admin'),
				order: 999,
				color: categoryColor(t.category),
				href: t.href,
				audience: 'admin',
			}),
		);

		const published = (data ?? [])
			.filter((d) => d.status === 'published' && !known.has(d.tool_key))
			.filter((d) => readUi(d).audience !== 'student')
			.map((d): CatalogTool => {
				const ui = readUi(d);
				// Sala (room_v1) OU tool com Banco → tela dedicada de gestão; pipeline
				// sem banco → editor no builder (?open=). Mesma regra do hook antigo.
				const href =
					d.engine_runtime === 'room_v1' || d.definition.bank?.enabled
						? `/ferramentas/t/${d.tool_key}`
						: `/ferramentas?open=${d.id}`;
				return {
					key: d.tool_key,
					title: d.title,
					description: d.description ?? undefined,
					Icon: resolveToolIcon(ui.icon),
					category: ui.category ?? 'outros',
					section: categoryToSection(ui.category, 'admin'),
					order: ui.order ?? 999,
					color: categoryColor(ui.category),
					href,
					audience: ui.audience ?? 'both',
				};
			});

		return [...code, ...published].sort(sortTools);
	}, [data, enabled]);

	return { tools, isLoading: enabled ? isLoading : false };
}

/* ── Aluno: entitlements + def por key (lista é admin-only) ── */
function useStudentCatalog(): UseToolCatalog {
	const { tools: entTools } = useEntitlements();

	const keys = useMemo(() => {
		const known = new Set(SYSTEM_TOOLS.map((t) => t.key));
		return entTools
			.filter((t) => t.entitled && !known.has(t.key))
			.map((t) => t.key);
	}, [entTools]);

	// Uma query por tool (dedupe/cache com `useToolDefinition`) só pro `ui.*`.
	const defs = useQueries({
		queries: keys.map((key) => ({
			queryKey: TOOL_DEFINITION_KEY(key),
			queryFn: () => getToolDefinition(key),
			staleTime: 60_000,
		})),
	});

	const isLoading = defs.some((q) => q.isLoading);

	// String estável `key→ui` (evita objetos novos como dependência do memo).
	const uiKey = keys
		.map((key, i) => {
			const ui = readUi(defs[i]?.data);
			return `${key}::${ui.icon ?? ''}::${ui.category ?? ''}::${
				ui.order ?? ''
			}::${ui.audience ?? ''}`;
		})
		.join('|');

	const tools = useMemo<CatalogTool[]>(() => {
		const uiByKey = new Map<string, ToolUi>(
			uiKey
				.split('|')
				.filter(Boolean)
				.map((row) => {
					const [key, icon, category, order, audience] = row.split('::');
					return [
						key,
						{
							icon: icon || undefined,
							category: category || undefined,
							order: order ? Number(order) : undefined,
							audience: (audience || undefined) as ToolAudience | undefined,
						},
					] as const;
				}),
		);
		const known = new Set(SYSTEM_TOOLS.map((t) => t.key));
		return entTools
			.filter((t) => t.entitled && !known.has(t.key))
			.map((t): CatalogTool => {
				const ui = uiByKey.get(t.key) ?? {};
				return {
					key: t.key,
					title: t.name,
					description: undefined,
					Icon: resolveToolIcon(ui.icon),
					category: ui.category ?? 'outros',
					section: categoryToSection(ui.category, 'student'),
					order: ui.order ?? 999,
					color: categoryColor(ui.category),
					href: `/course/t/${t.key}`,
					audience: ui.audience ?? 'both',
				};
			})
			.filter((t) => t.audience !== 'admin')
			.sort(sortTools);
	}, [entTools, uiKey]);

	return { tools, isLoading };
}

/**
 * Catálogo gateado para um público. ATENÇÃO: chame o hook do público certo — os
 * dois ramos usam hooks diferentes por baixo, então o `audience` não pode mudar
 * entre renders (regra dos hooks). Na prática cada superfície (admin vs course)
 * passa um literal fixo.
 */
export function useToolCatalog(audience: 'admin' | 'student'): UseToolCatalog {
	const admin = useAdminCatalog();
	const student = useStudentCatalog();
	return audience === 'admin' ? admin : student;
}
