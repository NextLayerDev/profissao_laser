import { z } from 'zod';
import { api } from '@/lib/fetch';

/**
 * Catálogo curado de modelos de imagem (OpenRouter) exposto pelo main API em
 * `GET /api/image-models`. A Fábrica de Tools (admin) consome via
 * `useImageModelCatalog` para popular o dropdown de modelo por tool.
 */

export const imageModelBestForSchema = z.enum([
	'laser',
	'poster',
	'text',
	'photoreal',
	'typography',
	'identity',
	'vector',
]);
export type ImageModelBestFor = z.infer<typeof imageModelBestForSchema>;

export const imageModelEntrySchema = z.object({
	id: z.string(),
	label: z.string(),
	bestFor: z.array(z.string()),
	notes: z.string(),
	default: z.boolean().optional(),
});
export type ImageModelEntry = z.infer<typeof imageModelEntrySchema>;

export const imageModelCatalogSchema = z.array(imageModelEntrySchema);
export type ImageModelCatalog = z.infer<typeof imageModelCatalogSchema>;

/** `GET /api/image-models` (main API). Auth requerida; qualquer user logado. */
export async function listImageModels(): Promise<ImageModelCatalog> {
	const { data } = await api.get('/api/image-models');
	return imageModelCatalogSchema.parse(data);
}
