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

/** Executa a tool no contexto de um curso, consumindo cota/voxes. */
export async function invokeTool(
	toolKey: string,
	courseSlug: string,
): Promise<InvokeToolResult> {
	const { data } = await api.post(`/v1/tool/${toolKey}/invoke`, {
		course_slug: courseSlug,
	});
	return invokeToolResultSchema.parse(data);
}

/** Cobrança atômica (debita + liquida) p/ ferramentas sem motor (ex.: "abrir item"). */
export async function consumeTool(
	toolKey: string,
	courseSlug: string,
): Promise<InvokeToolResult> {
	const { data } = await api.post(`/v1/tool/${toolKey}/use`, {
		course_slug: courseSlug,
	});
	return invokeToolResultSchema.parse(data);
}
