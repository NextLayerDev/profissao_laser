import { z } from 'zod';
import { apiCourses } from '@/shared/lib/api-courses';

/**
 * Categorias DINÂMICAS de ferramentas — o admin cria/edita as categorias do
 * "catálogo infinito" e o upvox as guarda (`public.tool_categories`). Cada
 * categoria diz em qual SEÇÃO da sidebar/hub a tool mora (separado admin/aluno)
 * e qual COR herda (paleta `TOOL_COLORS`). As categorias semente são `is_builtin`
 * e não podem ser apagadas; `outros` é o fallback obrigatório.
 *
 * `apiCourses` → upvox (`/v1/...`), espelhando `tool-definitions.service.ts`.
 */

export const toolCategoryDtoSchema = z
	.object({
		id: z.string(),
		slug: z.string(),
		label: z.string(),
		admin_section: z.string(),
		student_section: z.string(),
		color_key: z.string(),
		order_index: z.number(),
		is_builtin: z.boolean(),
	})
	.passthrough();
export type ToolCategoryDTO = z.infer<typeof toolCategoryDtoSchema>;

/** Corpo de criação — `slug` opcional (o back deriva do `label` se ausente). */
export interface CreateToolCategoryInput {
	label: string;
	color_key: string;
	admin_section?: string;
	student_section?: string;
	order_index?: number;
	slug?: string;
}

/** Corpo de edição — parcial; `slug` é imutável (não vai no PATCH). */
export interface UpdateToolCategoryInput {
	label?: string;
	color_key?: string;
	admin_section?: string;
	student_section?: string;
	order_index?: number;
}

/* ── Leitura (qualquer autenticado) — já ordenado por `order_index` no back ── */
export async function listCategories(): Promise<ToolCategoryDTO[]> {
	const { data } = await apiCourses.get('/v1/tool-categories');
	return z.array(toolCategoryDtoSchema).parse(data);
}

/* ── Mutações (admin) ── */
export async function createCategory(
	body: CreateToolCategoryInput,
): Promise<ToolCategoryDTO> {
	const { data } = await apiCourses.post('/v1/tool-categories', body);
	return toolCategoryDtoSchema.parse(data);
}

export async function updateCategory(
	id: string,
	body: UpdateToolCategoryInput,
): Promise<ToolCategoryDTO> {
	const { data } = await apiCourses.patch(`/v1/tool-categories/${id}`, body);
	return toolCategoryDtoSchema.parse(data);
}

export async function deleteCategory(id: string): Promise<void> {
	await apiCourses.delete(`/v1/tool-categories/${id}`);
}

/** Reordena: `order_index` segue a ordem do array de ids enviado. */
export async function reorderCategories(ids: string[]): Promise<void> {
	await apiCourses.post('/v1/tool-categories/reorder', { ids });
}
