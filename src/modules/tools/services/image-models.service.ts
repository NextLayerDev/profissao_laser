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

export const imageModelSpeedSchema = z.enum(['fast', 'medium', 'slow']);
export type ImageModelSpeed = z.infer<typeof imageModelSpeedSchema>;
export const imageModelQualitySchema = z.enum(['standard', 'high', 'top']);
export type ImageModelQuality = z.infer<typeof imageModelQualitySchema>;

export const imageModelEntrySchema = z.object({
	id: z.string(),
	label: z.string(),
	bestFor: z.array(z.string()),
	speed: imageModelSpeedSchema.optional(),
	quality: imageModelQualitySchema.optional(),
	notes: z.string(),
	default: z.boolean().optional(),
});
export type ImageModelEntry = z.infer<typeof imageModelEntrySchema>;

export const imageModelCatalogSchema = z.array(imageModelEntrySchema);
export type ImageModelCatalog = z.infer<typeof imageModelCatalogSchema>;

/**
 * `GET /api/image-models` (main API). Auth requerida; qualquer user logado.
 * Cache-bust por query param `_t` (URL única → o browser não reusa resposta
 * antiga). NÃO usar header `Cache-Control` aqui: ele não está no
 * `Access-Control-Allow-Headers` do gateway e a preflight CORS barra o GET.
 * O endpoint já responde `no-store`, então o `_t` é só um seguro extra.
 */
export async function listImageModels(): Promise<ImageModelCatalog> {
	const { data } = await api.get('/api/image-models', {
		params: { _t: Date.now() },
	});
	return imageModelCatalogSchema.parse(data);
}
