'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useEntitlements } from '@/hooks/use-entitlements';
import { usePermissions } from '@/modules/access';
import { TOOL_COLORS, type ToolColorKey } from '@/utils/constants/tool-colors';
import { categoryColor, categoryToSection } from '../lib/tool-categories';
import { resolveToolIcon } from '../lib/tool-icons';
import {
	type AiToolDefinition,
	getToolDefinition,
	listToolDefinitions,
} from '../services/tool-definitions.service';
import { SYSTEM_TOOLS } from '../system-tools';
import { useToolCategories } from './use-tool-categories';
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

/**
 * Tools NATIVAS do admin (engine_runtime `native_v1`): cada uma é uma PÁGINA
 * própria do app (rota dedicada), não um pipeline da Fábrica. Esta lista é o
 * fallback ESTÁTICO — garante que a tool apareça no catálogo mesmo quando o
 * upvox não é consultado (staff não-super não chama `listToolDefinitions`, senão
 * tomaria 403). Cada entrada é gateada pela sua `permission` (via `can`). Quando
 * o super-admin tem a linha do banco (`native_v1`), ela tem prioridade — esta
 * estática serve só de espelho/fallback. `category` mapeia pra seção/cor.
 */
const NATIVE_ADMIN_TOOLS: {
	key: string;
	title: string;
	icon: string;
	href: string;
	category: string;
	permission: string;
}[] = [
	{
		key: 'parametros_admin',
		title: 'Parâmetros',
		icon: 'sliders-horizontal',
		href: '/parametros',
		category: 'parametros',
		permission: 'acessos.view',
	},
	{
		key: 'vetorizacao_admin',
		title: 'Vetorização',
		icon: 'pen-line',
		href: '/vetorizacao-admin',
		category: 'vetor',
		permission: 'ferramentas.view',
	},
	{
		key: 'grupo_whatsapp_admin',
		title: 'Grupo WhatsApp',
		icon: 'message-circle',
		href: '/grupo-whatsapp',
		category: 'comunicacao',
		permission: 'alunos.view',
	},
	{
		key: 'previas_admin',
		title: 'Prévias IA',
		icon: 'eye',
		href: '/previas-admin',
		category: 'imagem',
		permission: 'ferramentas.view',
	},
	{
		key: 'fornecedores_admin',
		title: 'Fornecedores',
		icon: 'store',
		href: '/fornecedores-admin',
		category: 'fornecedores',
		permission: 'ferramentas.view',
	},
];

type ToolUi = {
	icon?: string;
	category?: string;
	order?: number;
	audience?: ToolAudience;
	/** Cor PRÓPRIA da tool (chave de `TOOL_COLORS`) — sobrescreve a da categoria. */
	color?: string;
	/** Tools nativas (`native_v1`): rota da página e permissão que a gateia. */
	href?: string;
	permission?: string;
};

function readUi(def: AiToolDefinition | undefined): ToolUi {
	return (def?.definition.ui ?? {}) as ToolUi;
}

/**
 * Cor final de uma tool: `ui.color` PRÓPRIA quando válida na paleta, senão a cor
 * herdada da CATEGORIA (comportamento legado). Um único ponto de override.
 */
function safeColor(key: string | undefined, category?: string): ToolColorKey {
	if (key && key in TOOL_COLORS) return key as ToolColorKey;
	return categoryColor(category);
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
	const { isSuperAdmin, can } = usePermissions();
	// IMPORTANTE: só super-admin consulta o upvox — staff comum tomaria 403 em
	// `listToolDefinitions`. A query fica `enabled` só pra ele; os demais veem
	// apenas o fallback estático (`nativeStatic`) já gateado por permissão.
	const enabled = isSuperAdmin;

	// Alimenta o registry de categorias (side-effect no hook) e dá ao memo uma
	// dependência reativa: ao criar/editar/reordenar categoria, `categories` muda
	// → o catálogo recompõe e `categoryToSection`/`categoryColor` resolvem o novo.
	const { categories } = useToolCategories();

	const { data, isLoading } = useQuery({
		queryKey: ['tool-definitions'],
		queryFn: listToolDefinitions,
		enabled,
		staleTime: 60_000,
	});

	const tools = useMemo<CatalogTool[]>(() => {
		const known = new Set(SYSTEM_TOOLS.map((t) => t.key));

		// Fallback estático das tools nativas — sempre disponível (não depende do
		// upvox), gateado pela permissão de cada uma. É o ÚNICO que staff não-super
		// recebe. Ordem padrão 10/20/30 pra preservar a sequência declarada.
		const nativeStatic = NATIVE_ADMIN_TOOLS.filter((t) =>
			can(t.permission),
		).map(
			(t, i): CatalogTool => ({
				key: t.key,
				title: t.title,
				description: undefined,
				Icon: resolveToolIcon(t.icon),
				category: t.category,
				section: categoryToSection(t.category, 'admin'),
				order: (i + 1) * 10,
				color: categoryColor(t.category),
				href: t.href,
				audience: 'admin',
			}),
		);

		// Sem upvox (staff não-super): só as nativas estáticas permitidas.
		if (!isSuperAdmin) return nativeStatic.sort(sortTools);

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

		// Tools nativas vindas do BANCO (reflete edições do super-admin). Inclui
		// DRAFTS de propósito — deixa o super-admin ver/editar; front antigo de
		// prod ignora rascunhos. Gateadas pela `permission` declarada na `ui`.
		const nativeRows = (data ?? [])
			.filter((d) => d.engine_runtime === 'native_v1')
			.filter((d) => can(readUi(d).permission ?? ''))
			.map((d): CatalogTool => {
				const ui = readUi(d);
				return {
					key: d.tool_key,
					title: d.title,
					description: d.description ?? undefined,
					Icon: resolveToolIcon(ui.icon),
					category: ui.category ?? 'outros',
					section: categoryToSection(ui.category, 'admin'),
					order: ui.order ?? 999,
					color: safeColor(ui.color, ui.category),
					href: ui.href ?? '#',
					audience: 'admin',
				};
			});

		const published = (data ?? [])
			.filter(
				(d) =>
					d.status === 'published' &&
					!known.has(d.tool_key) &&
					d.engine_runtime !== 'native_v1',
			)
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
					color: safeColor(ui.color, ui.category),
					href,
					audience: ui.audience ?? 'both',
				};
			});

		// Linha do banco tem prioridade sobre a estática (mesma `key`): adiciona a
		// estática só quando não há linha correspondente (ainda não migrada).
		const nativeFallback = nativeStatic.filter(
			(s) => !nativeRows.some((n) => n.key === s.key),
		);

		// `categories` (na dep do memo) força recompor seção/cor quando o admin mexe
		// nas categorias — o registry já foi atualizado pelo `useToolCategories`.
		void categories;
		return [...code, ...published, ...nativeRows, ...nativeFallback].sort(
			sortTools,
		);
	}, [data, isSuperAdmin, can, categories]);

	return { tools, isLoading: enabled ? isLoading : false };
}

/* ── Aluno: entitlements + def por key (lista é admin-only) ── */
function useStudentCatalog(): UseToolCatalog {
	const { tools: entTools } = useEntitlements();
	// Mesma razão do admin: seta o registry + recompõe quando as categorias mudam.
	const { categories } = useToolCategories();

	const keys = useMemo(() => {
		const known = new Set(SYSTEM_TOOLS.map((t) => t.key));
		return entTools
			.filter((t) => (t.entitled || t.is_free) && !known.has(t.key))
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
		// `categories` (na dep do memo) força recompor seção/cor quando as categorias
		// dinâmicas mudam — o registry já foi atualizado pelo `useToolCategories`.
		void categories;
		return entTools
			.filter((t) => (t.entitled || t.is_free) && !known.has(t.key))
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
					color: safeColor(ui.color, ui.category),
					href: `/course/t/${t.key}`,
					audience: ui.audience ?? 'both',
				};
			})
			.filter((t) => t.audience !== 'admin')
			.sort(sortTools);
	}, [entTools, uiKey, categories]);

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
