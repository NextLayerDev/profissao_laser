import { z } from 'zod';
import { api } from '@/lib/fetch';

/**
 * O PORTÃO DO VENDEDOR — os canais onde o aluno vende e o aceite do termo.
 *
 * Fala com a MAIN API (`api` / `NEXT_PUBLIC_GATEWAY_URL`), em
 * `/api/me/licensed-seller`, pelo mesmo cliente das marcas e da biblioteca: a
 * declaração é do domínio de licenciamento, não de billing.
 *
 * O TEXTO DO TERMO VEM DO SERVIDOR, e não daqui. O que se registra no aceite é
 * uma versão, e o que dá sentido à versão é o texto que ela nomeia — com o
 * texto no front, um deploy poderia mudar o que as pessoas leem sem mudar o que
 * o banco diz que elas aceitaram.
 */

export const canalDeVendaSchema = z.object({
	id: z.string(),
	url: z.string(),
	label: z.string().nullable(),
	createdAt: z.string(),
});
export type CanalDeVenda = z.infer<typeof canalDeVendaSchema>;

/** Por que a declaração não está valendo. `ok` é o único que libera. */
export const statusDaDeclaracaoSchema = z.enum([
	'sem_canal',
	'termo_pendente',
	'lista_mudou',
	'termo_mudou',
	'ok',
]);
export type StatusDaDeclaracao = z.infer<typeof statusDaDeclaracaoSchema>;

export const declaracaoSchema = z.object({
	status: statusDaDeclaracaoSchema,
	ok: z.boolean(),
	channels: z.array(canalDeVendaSchema),
	terms: z.object({
		version: z.string(),
		clauses: z.array(z.object({ titulo: z.string(), texto: z.string() })),
	}),
	accepted: z.object({ version: z.string(), at: z.string() }).nullable(),
});
export type Declaracao = z.infer<typeof declaracaoSchema>;

export async function getDeclaracao(): Promise<Declaracao> {
	const { data } = await api.get('/api/me/licensed-seller');
	return declaracaoSchema.parse(data);
}

export async function addCanal(input: {
	url: string;
	label?: string;
}): Promise<CanalDeVenda> {
	const { data } = await api.post('/api/me/licensed-seller/channels', input);
	return canalDeVendaSchema.parse(data);
}

export async function removeCanal(id: string): Promise<void> {
	await api.delete(`/api/me/licensed-seller/channels/${id}`);
}

export async function aceitarTermo(): Promise<Declaracao> {
	const { data } = await api.post('/api/me/licensed-seller/accept');
	return declaracaoSchema.parse(data);
}

/* ────────────────────────────── staff ────────────────────────────── */

export const vendedorDeclaradoSchema = z.object({
	customerId: z.string(),
	channels: z.array(
		z.object({ url: z.string(), label: z.string().nullable() }),
	),
	acceptedAt: z.string().nullable(),
	acceptedVersion: z.string().nullable(),
	upToDate: z.boolean(),
});
export type VendedorDeclarado = z.infer<typeof vendedorDeclaradoSchema>;

/**
 * Com `featureKey`, só quem de fato gerou peça daquela marca — que é o recorte
 * entregável ao clube.
 */
export async function listVendedores(
	featureKey?: string,
): Promise<VendedorDeclarado[]> {
	const { data } = await api.get('/api/licensed-seller', {
		params: featureKey ? { feature_key: featureKey } : undefined,
	});
	return z.array(vendedorDeclaradoSchema).parse(data);
}
