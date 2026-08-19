import { z } from 'zod';
import { api } from '@/lib/fetch';

/**
 * As artes licenciadas que o aluno gerou — a biblioteca dele.
 *
 * Cada linha é uma peça com o direito de uso atestado: a arte, o código e o QR.
 * Existe porque a arte sem o código não serve para nada: quem produz uma peça
 * meses depois precisa reencontrar o QR daquela geração, e a URL do CDN sozinha
 * não diz qual código pertence a ela.
 */
export const myLicensedArtSchema = z.object({
	id: z.string(),
	code: z.string(),
	featureKey: z.string(),
	licensorName: z.string().nullable(),
	previewUrl: z.string().nullable(),
	promptTitle: z.string().nullable(),
	revoked: z.boolean(),
	archived: z.boolean(),
	/** O lote a que a peça pertence, e a posição dela nele. */
	batchId: z.string().nullable().default(null),
	pieceIndex: z.number().default(1),
	batchSize: z.number().default(1),
	/** A tiragem deste lote ainda pode crescer? */
	canGrow: z.boolean().default(false),
	issuedAt: z.string(),
});
export type MyLicensedArt = z.infer<typeof myLicensedArtSchema>;

export async function listMyLicensedArt(
	opts: { archived?: boolean } = {},
): Promise<MyLicensedArt[]> {
	const { data } = await api.get('/api/me/licensed-art', {
		params: opts.archived ? { archived: 'true' } : undefined,
	});
	return z.array(myLicensedArtSchema).parse(data);
}

/**
 * Arquivar guarda a peça; desarquivar traz de volta. Nenhum dos dois apaga
 * nada: o QR pode já estar gravado numa peça física, e um código que deixa de
 * responder é lido como falsificação por quem escaneia.
 */
export async function archiveMyLicensedArt(
	id: string,
	archived: boolean,
): Promise<MyLicensedArt> {
	const url = `/api/me/licensed-art/${id}/archive`;
	const { data } = archived ? await api.post(url) : await api.delete(url);
	return myLicensedArtSchema.parse(data);
}

/** As peças novas que uma ampliação de tiragem produziu. */
export const novasPecasSchema = z.object({
	pieces: z.array(
		z.object({ index: z.number(), code: z.string(), url: z.string() }),
	),
});
export type NovasPecas = z.infer<typeof novasPecasSchema>;

/**
 * Emite mais peças de um lote que já existe, com a MESMA arte.
 *
 * A cobrança já aconteceu: `invocationId` é a rodada paga, e é dela que o
 * servidor lê quantas peças foram compradas — o número nunca vem daqui.
 */
export async function ampliarTiragem(
	batchId: string,
	invocationId: string,
): Promise<NovasPecas> {
	const { data } = await api.post(
		`/api/me/licensed-art/batches/${batchId}/pieces`,
		{ invocation_id: invocationId, tool_key: 'arte_licenciada' },
	);
	return novasPecasSchema.parse(data);
}
