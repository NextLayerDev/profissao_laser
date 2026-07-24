import { z } from 'zod';
import { api } from '@/lib/fetch';

/**
 * Resoluções padrão globais (`GET/POST/PATCH/DELETE /api/image-size-presets`)
 * usadas como uma das formas de `data.image_size` de um registro do Banco
 * (ver `ImageSizeControl` em `tool-bank-manager.tsx`).
 */
export const imageSizePresetSchema = z.object({
	id: z.string(),
	name: z.string(),
	width: z.coerce.number(),
	height: z.coerce.number(),
	created_at: z.string(),
	updated_at: z.string(),
});
export type ImageSizePreset = z.infer<typeof imageSizePresetSchema>;

export async function listImageSizePresets(): Promise<ImageSizePreset[]> {
	const { data } = await api.get('/api/image-size-presets');
	return z.array(imageSizePresetSchema).parse(data);
}

export async function createImageSizePreset(input: {
	name: string;
	width: number;
	height: number;
}): Promise<ImageSizePreset> {
	const { data } = await api.post('/api/image-size-presets', input);
	return imageSizePresetSchema.parse(data);
}

export async function updateImageSizePreset(
	id: string,
	input: Partial<{ name: string; width: number; height: number }>,
): Promise<ImageSizePreset> {
	const { data } = await api.patch(`/api/image-size-presets/${id}`, input);
	return imageSizePresetSchema.parse(data);
}

export async function deleteImageSizePreset(id: string): Promise<void> {
	await api.delete(`/api/image-size-presets/${id}`);
}
