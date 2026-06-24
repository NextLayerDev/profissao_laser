import { z } from 'zod';
import { api } from '@/lib/fetch';

/**
 * "Banco do Admin" — capacidade genérica da Fábrica de Tools. Cada tool com
 * `definition.bank.enabled` ganha uma lista de REGISTROS que o admin alimenta
 * (ex.: Prompts Mágicos: cada registro é um prompt + modo). O cliente vê os
 * ativos como uma galeria de cards e escolhe um pra gerar.
 *
 * Tudo aqui fala com a MAIN API (`api` / `NEXT_PUBLIC_GATEWAY_URL`), em
 * `/api/tools/:key/bank` — NÃO com o upvox (`apiCourses`). Os endpoints de
 * escrita são multipart (arquivos de exemplo + `data` JSON).
 */

export const toolBankEntrySchema = z.object({
	id: z.string(),
	tool_key: z.string(),
	title: z.string(),
	description: z.string().nullable(),
	category: z.string().nullable(),
	position: z.coerce.number(),
	active: z.boolean(),
	data: z.record(z.string(), z.unknown()).default({}),
	example_before_url: z.string().nullable(),
	example_after_url: z.string().nullable(),
	created_at: z.string(),
	updated_at: z.string(),
});
export type ToolBankEntry = z.infer<typeof toolBankEntrySchema>;

/** Lista os registros do banco de uma tool. Cliente recebe só os ativos; staff vê todos. */
export async function listToolBank(
	toolKey: string,
	category?: string,
): Promise<ToolBankEntry[]> {
	const { data } = await api.get(`/api/tools/${toolKey}/bank`, {
		params: category ? { category } : undefined,
	});
	return z.array(toolBankEntrySchema).parse(data);
}

/** Cria um registro (admin, multipart). A `FormData` já vem montada pelo manager. */
export async function createToolBankEntry(
	toolKey: string,
	body: FormData,
): Promise<ToolBankEntry> {
	const { data } = await api.post(`/api/tools/${toolKey}/bank`, body);
	return toolBankEntrySchema.parse(data);
}

/** Atualiza parcialmente um registro (admin, multipart). */
export async function updateToolBankEntry(
	toolKey: string,
	id: string,
	body: FormData,
): Promise<ToolBankEntry> {
	const { data } = await api.patch(`/api/tools/${toolKey}/bank/${id}`, body);
	return toolBankEntrySchema.parse(data);
}

/** Remove um registro (admin). */
export async function deleteToolBankEntry(
	toolKey: string,
	id: string,
): Promise<void> {
	await api.delete(`/api/tools/${toolKey}/bank/${id}`);
}

/** Reordena o banco pela nova ordem de ids (admin). */
export async function reorderToolBank(
	toolKey: string,
	ids: string[],
): Promise<void> {
	await api.post(`/api/tools/${toolKey}/bank/reorder`, { ids });
}

export const uploadImageResultSchema = z.object({ url: z.string() });
export type UploadImageResult = z.infer<typeof uploadImageResultSchema>;

/** Sobe uma imagem avulsa (ex.: campo de imagem de um registro) e devolve a URL. */
export async function uploadToolBankImage(
	toolKey: string,
	file: File,
): Promise<string> {
	const fd = new FormData();
	fd.append('file', file);
	const { data } = await api.post(
		`/api/tools/${toolKey}/bank/upload-image`,
		fd,
	);
	return uploadImageResultSchema.parse(data).url;
}
