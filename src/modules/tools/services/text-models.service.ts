import { z } from 'zod';
import { api } from '@/lib/fetch';

/**
 * Catálogo curado de modelos de TEXTO (OpenRouter) exposto pelo main API em
 * `GET /api/text-models`. Espelho de `image-models.service`, para o admin
 * escolher o modelo do bloco `ai.text` por tool.
 *
 * Campos que imagem não precisava: `toolUse` (sem tool-calling o modelo não
 * roda como agente), `json` (saída estruturada), `vision` e `pricing`.
 */

export const textModelBestForSchema = z.enum([
	'raciocinio',
	'cad',
	'extracao',
	'redacao',
	'juiz',
	'visao',
	'barato',
]);
export type TextModelBestFor = z.infer<typeof textModelBestForSchema>;

export const textModelSpeedSchema = z.enum([
	'instant',
	'fast',
	'medium',
	'slow',
]);
export const textModelQualitySchema = z.enum(['standard', 'high', 'top']);

export const textModelEntrySchema = z.object({
	id: z.string(),
	provider: z.string(),
	label: z.string(),
	bestFor: z.array(z.string()),
	speed: textModelSpeedSchema,
	quality: textModelQualitySchema,
	contextK: z.number(),
	toolUse: z.boolean(),
	json: z.boolean(),
	vision: z.boolean(),
	pricing: z.object({
		in: z.number(),
		out: z.number(),
		cacheWrite: z.number().optional(),
		cacheRead: z.number().optional(),
	}),
	notes: z.string(),
	default: z.boolean().optional(),
	tierDefault: textModelSpeedSchema.optional(),
});
export type TextModelEntry = z.infer<typeof textModelEntrySchema>;

export const textModelCatalogSchema = z.array(textModelEntrySchema);
export type TextModelCatalog = z.infer<typeof textModelCatalogSchema>;

/**
 * `GET /api/text-models` (main API). Mesmo cuidado do catálogo de imagem: o
 * cache-bust vai por query param `_t`, NUNCA por header `Cache-Control` — ele
 * não está no `Access-Control-Allow-Headers` do gateway e a preflight CORS
 * barraria o GET.
 */
export async function listTextModels(): Promise<TextModelCatalog> {
	const { data } = await api.get('/api/text-models', {
		params: { _t: Date.now() },
	});
	return textModelCatalogSchema.parse(data);
}
