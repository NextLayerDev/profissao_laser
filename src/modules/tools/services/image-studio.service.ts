import { z } from 'zod';
import { api } from '@/lib/fetch';

/**
 * ESTÚDIO DE IMAGENS (front) — as duas rotas que não passam pelo motor
 * genérico: o enhancer de prompt e a ponte com a Vetorização.
 *
 * Tudo aqui bate na main API (`api`), não no upvox: a galeria mora numa coleção
 * da Fábrica e a vetorização é da main.
 */

/* ─────────────────────────── enhancer ─────────────────────────── */

const enhanceSchema = z.object({
	enhanced: z.string(),
	suggestions: z.array(z.string()).default([]),
	/** Teto de 30/h estourado — a tela avisa em vez de fingir que melhorou. */
	limited: z.boolean().optional(),
});
export type EnhanceResult = z.infer<typeof enhanceSchema>;

/**
 * O back é fail-open (qualquer erro devolve o prompt original), e este cliente
 * também: se a REQUISIÇÃO falhar, devolvemos o prompt intacto. O enhancer é
 * conveniência; ele nunca pode impedir alguém de gerar.
 */
export async function enhancePrompt(
	prompt: string,
	mode: string,
): Promise<EnhanceResult> {
	try {
		const { data } = await api.post('/api/image-studio/enhance', {
			prompt,
			mode,
		});
		return enhanceSchema.parse(data);
	} catch {
		return { enhanced: prompt, suggestions: [] };
	}
}

/* ─────────────────────── ponte com a Vetorização ─────────────────────── */

const toVectorSchema = z.object({
	vectorId: z.string(),
	paidFormats: z.array(z.string()).default([]),
	vectorReady: z.boolean().default(false),
});
export type ToVectorResult = z.infer<typeof toVectorSchema>;

/**
 * Manda uma imagem da galeria para a Vetorização SEM passar pelo browser: o
 * servidor lê o registro, confere o dono e baixa o PNG direto do storage.
 *
 * `invocationId` vem do fluxo de billing padrão (`useToolBilling.runEngine`) —
 * a cobrança é a da tool `vectorize`, a mesma do line-art com IA.
 */
export async function galleryToVector(
	entryId: string,
	toolKey: string,
	collection: string,
	invocationId?: string,
): Promise<ToVectorResult> {
	const { data } = await api.post(
		`/api/image-gallery/${encodeURIComponent(entryId)}/to-vector`,
		{
			tool_key: toolKey,
			collection,
			...(invocationId ? { invocation_id: invocationId } : {}),
		},
	);
	return toVectorSchema.parse(data);
}

/* ─────────────────────────── util ─────────────────────────── */

/**
 * URL do CDN → `File`, para reusar uma imagem da galeria como REFERÊNCIA de um
 * novo run (variação, edição com máscara, ampliar, remover fundo).
 *
 * Aqui não dá para fazer como na ponte da vetorização: o motor recebe os bytes
 * por multipart, então a imagem precisa mesmo voltar ao browser. O custo é um
 * download extra de alguns MB — pago só quando a pessoa PEDE para iterar em
 * cima de uma imagem, nunca automaticamente.
 *
 * Depende de o CDN responder com CORS liberado (é o mesmo pressuposto de
 * `lib/duplicate-product.ts`). Falhou, quem chama avisa — em vez de mandar um
 * run sem a referência e cobrar por uma geração que ignora a imagem escolhida.
 */
export async function urlToFile(url: string, name = 'imagem'): Promise<File> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`storage respondeu ${res.status}`);
	const blob = await res.blob();
	const ext = (blob.type.split('/')[1] ?? 'png').split('+')[0];
	return new File([blob], `${name}.${ext}`, {
		type: blob.type || 'image/png',
	});
}
