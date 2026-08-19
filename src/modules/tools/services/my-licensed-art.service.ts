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
	issuedAt: z.string(),
});
export type MyLicensedArt = z.infer<typeof myLicensedArtSchema>;

export async function listMyLicensedArt(): Promise<MyLicensedArt[]> {
	const { data } = await api.get('/api/me/licensed-art');
	return z.array(myLicensedArtSchema).parse(data);
}
