import { z } from 'zod';
import { apiCourses } from '@/shared/lib/api-courses';

/**
 * Uma ferramenta/página liberada para quem ainda não assinou — vem de
 * `tools.is_free` (o mesmo flag do admin "Páginas e ferramentas grátis" e do
 * gating por entitlements).
 */
export const freeToolSchema = z.object({
	key: z.string(),
	name: z.string(),
});
export type FreeTool = z.infer<typeof freeToolSchema>;

/** Resumo público do que é grátis (aulas, prévias e ferramentas liberadas). */
export const freeSummarySchema = z.object({
	free_lessons_count: z.number().int().nonnegative(),
	courses_with_preview_count: z.number().int().nonnegative(),
	free_tools: z.array(freeToolSchema),
});
export type FreeSummary = z.infer<typeof freeSummarySchema>;

/**
 * Fallback estático — usado só enquanto o endpoint público não responde
 * (ex.: antes do deploy do api-upvox). `free_tools` vazio porque hoje nenhuma
 * tool está marcada como grátis; a seção simplesmente omite essa parte até o
 * admin liberar alguma em "Páginas e ferramentas grátis".
 */
export const FALLBACK_FREE_SUMMARY: FreeSummary = {
	free_lessons_count: 16,
	courses_with_preview_count: 6,
	free_tools: [],
};

/**
 * Resumo público do que é grátis, para a seção "Entre de graça" da landing.
 * GET /v1/catalog/free-summary (público, sem auth). Cai no fallback se o
 * endpoint falhar ou o payload não bater — a página nunca quebra.
 */
export async function getFreeSummary(): Promise<FreeSummary> {
	try {
		const { data } = await apiCourses.get('/v1/catalog/free-summary');
		return freeSummarySchema.parse(data);
	} catch {
		return FALLBACK_FREE_SUMMARY;
	}
}
