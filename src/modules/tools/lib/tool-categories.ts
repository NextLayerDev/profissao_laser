import { TOOL_COLORS, type ToolColorKey } from '@/utils/constants/tool-colors';
import type { ToolCategoryDTO } from '../services/tool-categories.service';

/**
 * Catálogo curado de CATEGORIAS de ferramentas — a espinha dorsal do "catálogo
 * infinito": uma tool da Fábrica declara `ui.category` no builder e, a partir
 * dela, sabemos (1) em qual SEÇÃO da sidebar/hub ela mora — separado p/ admin e
 * aluno, porque as topologias diferem — e (2) qual COR herda (paleta única em
 * `tool-colors.ts`). Categoria ausente/desconhecida cai sempre em `outros`.
 *
 * As seções são ids canônicos (string-literal unions). A sidebar e o hub
 * renderizam os grupos NESTA ordem; tools sem pin vivem só no hub/⌘K.
 *
 * A lista abaixo (`TOOL_CATEGORIES`) é o FALLBACK estático. Em runtime, o hook
 * `useToolCategories` alimenta um REGISTRY mutável (`setCategoryRegistry`) com as
 * categorias dinâmicas vindas do upvox; os helpers puros (`categoryById` etc.)
 * consultam o registry PRIMEIRO (por slug) e só então a lista estática. Assim
 * todo call-site puro existente continua funcionando E passa a ser dinâmico.
 */

// info: ordem aqui = ordem de render dos grupos na sidebar/hub do admin.
export const ADMIN_SECTIONS = [
	'PRINCIPAL',
	'CONTEUDO',
	'OPERACAO',
	'FERRAMENTAS',
	'SISTEMA',
] as const;
export type AdminSection = (typeof ADMIN_SECTIONS)[number];

// info: ordem aqui = ordem de render dos grupos na home/sidebar do aluno.
export const STUDENT_SECTIONS = [
	'CONTEUDO',
	'COMUNIDADE',
	'FERRAMENTAS',
] as const;
export type StudentSection = (typeof STUDENT_SECTIONS)[number];

export interface ToolCategory {
	/** Id estável guardado em `ui.category` (slug curto). */
	id: string;
	/** Rótulo humano (PT-BR) exibido no hub/picker. */
	label: string;
	/** Seção da topologia do ADMIN onde a tool aparece. */
	adminSection: AdminSection;
	/** Seção da topologia do ALUNO onde a tool aparece. */
	studentSection: StudentSection;
	/** Cor herdada (chave da paleta única `TOOL_COLORS`). */
	color: ToolColorKey;
}

/**
 * Lista curada. Para adicionar uma categoria nova: acrescente uma entrada com
 * uma `color` VÁLIDA de `TOOL_COLORS` e mapeie suas seções admin/aluno. A
 * última (`outros`) é o fallback obrigatório — não remova.
 */
export const TOOL_CATEGORIES: ToolCategory[] = [
	{
		id: 'imagem',
		label: 'Imagem',
		adminSection: 'FERRAMENTAS',
		studentSection: 'FERRAMENTAS',
		color: 'previas',
	},
	{
		id: 'vetor',
		label: 'Vetor',
		adminSection: 'FERRAMENTAS',
		studentSection: 'FERRAMENTAS',
		color: 'vetorizacao',
	},
	{
		id: 'producao',
		label: 'Produção',
		adminSection: 'FERRAMENTAS',
		studentSection: 'FERRAMENTAS',
		color: 'gravacao',
	},
	{
		id: 'ia',
		label: 'Inteligência Artificial',
		adminSection: 'FERRAMENTAS',
		studentSection: 'FERRAMENTAS',
		color: 'voxxys',
	},
	{
		id: 'comunidade',
		label: 'Comunidade',
		adminSection: 'OPERACAO',
		studentSection: 'COMUNIDADE',
		color: 'forum',
	},
	{
		id: 'conteudo',
		label: 'Conteúdo',
		adminSection: 'CONTEUDO',
		studentSection: 'CONTEUDO',
		color: 'aulas',
	},
	{
		id: 'parametros',
		label: 'Parâmetros',
		adminSection: 'FERRAMENTAS',
		studentSection: 'FERRAMENTAS',
		color: 'parametros',
	},
	{
		id: 'comunicacao',
		label: 'Comunicação',
		adminSection: 'FERRAMENTAS',
		studentSection: 'FERRAMENTAS',
		color: 'chat',
	},
	{
		id: 'outros',
		label: 'Outros',
		adminSection: 'FERRAMENTAS',
		studentSection: 'FERRAMENTAS',
		color: 'parametros',
	},
];

/** Fallback obrigatório — sempre presente (último da lista). */
const FALLBACK: ToolCategory =
	TOOL_CATEGORIES.find((c) => c.id === 'outros') ?? TOOL_CATEGORIES[0];

const STATIC_BY_ID = new Map(TOOL_CATEGORIES.map((c) => [c.id, c]));

/**
 * REGISTRY dinâmico (mutável, escopo de módulo): preenchido em runtime pelo hook
 * `useToolCategories` a partir das categorias do upvox. Indexado por SLUG. Vazio
 * por padrão → tudo resolve pela lista estática (comportamento legado intacto).
 */
const DYNAMIC_BY_SLUG = new Map<string, ToolCategory>();

/** `color_key` do DTO só vale se existir em `TOOL_COLORS`; senão → 'parametros'. */
function safeColor(colorKey: string): ToolColorKey {
	return colorKey in TOOL_COLORS ? (colorKey as ToolColorKey) : 'parametros';
}

/**
 * Alimenta o registry dinâmico a partir dos DTOs do upvox. Cada DTO vira uma
 * `ToolCategory` interna: `slug` é o id, `admin_section`/`student_section` viram
 * as seções e `color_key` é VALIDADO contra `TOOL_COLORS` (desconhecido →
 * 'parametros'). Substitui o conteúdo inteiro (idempotente). Passar `[]` zera o
 * registry e devolve a resolução ao fallback estático.
 */
export function setCategoryRegistry(dtos: ToolCategoryDTO[]): void {
	DYNAMIC_BY_SLUG.clear();
	for (const dto of dtos) {
		DYNAMIC_BY_SLUG.set(dto.slug, {
			id: dto.slug,
			label: dto.label,
			adminSection: dto.admin_section as AdminSection,
			studentSection: dto.student_section as StudentSection,
			color: safeColor(dto.color_key),
		});
	}
}

/**
 * Resolve uma categoria por id/slug. Ordem: registry dinâmico (upvox) → lista
 * estática (semente) → `outros`. Mantém todo call-site puro funcionando E
 * dinâmico assim que o hook setar o registry.
 */
export function categoryById(id?: string | null): ToolCategory {
	if (!id) return FALLBACK;
	return DYNAMIC_BY_SLUG.get(id) ?? STATIC_BY_ID.get(id) ?? FALLBACK;
}

/** Seção (admin OU aluno) em que a categoria mora. */
export function categoryToSection(
	id: string | undefined | null,
	audience: 'admin' | 'student',
): string {
	const cat = categoryById(id);
	return audience === 'admin' ? cat.adminSection : cat.studentSection;
}

/** Cor (chave de `TOOL_COLORS`) herdada da categoria. */
export function categoryColor(id?: string | null): ToolColorKey {
	return categoryById(id).color;
}
