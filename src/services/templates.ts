import { api } from '@/lib/fetch';
import type { Design } from '@/types/designs';
import type {
	CloneTemplatePayload,
	CreateTemplatePayload,
	Template,
	TemplatesResponse,
	UpdateTemplatePayload,
} from '@/types/templates';

export interface TemplatesQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	categoryId?: string;
	tipoImagem?: string;
	status?: string;
}

export async function getTemplates(
	params?: TemplatesQueryParams,
): Promise<TemplatesResponse> {
	const { data } = await api.get<TemplatesResponse>('/templates', { params });
	return data ?? { data: [], total: 0, page: 1, limit: 20 };
}

export async function getTemplate(id: string): Promise<Template> {
	const { data } = await api.get<Template>(`/templates/${id}`);
	return data;
}

export async function createTemplate(
	payload: CreateTemplatePayload,
): Promise<Template> {
	const { data } = await api.post<Template>('/templates', payload);
	return data;
}

export async function updateTemplate(
	id: string,
	payload: UpdateTemplatePayload,
): Promise<Template> {
	const { data } = await api.patch<Template>(`/templates/${id}`, payload);
	return data;
}

export async function uploadTemplateImage(
	id: string,
	file: File,
): Promise<Template> {
	const formData = new FormData();
	formData.append('file', file);
	const { data } = await api.post<Template>(`/templates/${id}/image`, formData);
	return data;
}

export async function deleteTemplate(id: string): Promise<void> {
	await api.delete(`/templates/${id}`);
}

export async function cloneTemplate(
	id: string,
	payload?: CloneTemplatePayload,
): Promise<Design> {
	const { data } = await api.post<Design>(
		`/templates/${id}/clone`,
		payload ?? {},
	);
	return data;
}
