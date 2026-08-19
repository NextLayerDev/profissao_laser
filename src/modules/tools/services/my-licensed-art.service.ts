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
