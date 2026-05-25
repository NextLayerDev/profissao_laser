import { api } from '@/shared/lib/fetch';
import {
	type CreateToolPayload,
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
