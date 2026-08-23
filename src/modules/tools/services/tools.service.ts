import { apiCourses as api } from '@/shared/lib/api-courses';
import {
	type CreateToolPayload,
	type InvokeToolResult,
	invokeToolResultSchema,
	type Tool,
	toolSchema,
	type UpdateToolPayload,
} from '../types/tools';

export async function listTools(): Promise<Tool[]> {
	const { data } = await api.get('/v1/tools');
	return toolSchema.array().parse(data);
}

export async function createTool(payload: CreateToolPayload): Promise<Tool> {
	const { data } = await api.post('/v1/tool', payload);
	return toolSchema.parse(data);
}

export async function updateTool(
	id: string,
	payload: UpdateToolPayload,
): Promise<Tool> {
	const { data } = await api.patch(`/v1/tool/${id}`, payload);
	return toolSchema.parse(data);
}

export async function deleteTool(id: string): Promise<void> {
	await api.delete(`/v1/tool/${id}`);
}

/**
 * Executa a tool no contexto de um curso, consumindo cota/voxes.
 * `variationCount` (1–4) escala o custo: o upvox debita `vox_cost × N`
 * (ex.: 0,5/vox × 2 = 1 vox). Default/omitido = cobrança única (tools legadas).
 */
export async function invokeTool(
	toolKey: string,
	courseSlug: string | undefined,
	variationCount?: number,
): Promise<InvokeToolResult> {
	const { data } = await api.post(`/v1/tool/${toolKey}/invoke`, {
		// Sem plano não há curso — o upvox cobra em voxxys sem escopo de curso.
		...(courseSlug ? { course_slug: courseSlug } : {}),
		...(variationCount && variationCount > 1
			? { variation_count: variationCount }
			: {}),
	});
	return invokeToolResultSchema.parse(data);
}

/** Cobrança atômica (debita + liquida) p/ ferramentas sem motor (ex.: "abrir item"). */
export async function consumeTool(
	toolKey: string,
	courseSlug: string | undefined,
): Promise<InvokeToolResult> {
	const { data } = await api.post(`/v1/tool/${toolKey}/use`, {
		...(courseSlug ? { course_slug: courseSlug } : {}),
	});
	return invokeToolResultSchema.parse(data);
}
