import { z } from 'zod';
import { api } from '@/lib/fetch';

/**
 * COLEÇÕES (front) — cliente da API genérica de dataset da Fábrica.
 *
 * Espelha `/api/tools/:key/c/:collection/*` na main API. Como no back, nada
 * aqui sabe o que é "Metallic": campos, facetas e permissões vêm da definition
 * e chegam prontos do servidor.
 */

export const collectionEntrySchema = z
	.object({
		id: z.string(),
		title: z.string(),
		description: z.string().nullable().optional(),
		category: z.string().nullable().optional(),
		data: z.record(z.string(), z.unknown()).default({}),
		score: z.number().nullable().optional(),
		stats: z.record(z.string(), z.number()).default({}),
		image: z.string().nullable().optional(),
		status: z.string(),
		is_mine: z.boolean().default(false),
		review_note: z.string().nullable().optional(),
		my_feedback: z
			.record(
				z.string(),
				z.object({
					value: z.number().nullable(),
					outcome: z.string().nullable(),
				}),
			)
			.default({}),
		/** Só em `nearest`. */
		distance: z.number().optional(),
		exact: z.boolean().optional(),
	})
	.passthrough();
export type CollectionEntry = z.infer<typeof collectionEntrySchema>;

export const collectionListSchema = z.object({
	items: z.array(collectionEntrySchema),
	total: z.number(),
	page: z.number(),
	page_size: z.number(),
	pages: z.number(),
});
export type CollectionList = z.infer<typeof collectionListSchema>;

export const facetSchema = z.object({
	name: z.string(),
	label: z.string(),
	kind: z.enum(['enum', 'range']),
	unit: z.string().optional(),
	options: z.array(z.unknown()).optional(),
	values: z
		.array(z.object({ value: z.unknown(), count: z.number() }))
		.optional(),
});
export type Facet = z.infer<typeof facetSchema>;

export const facetsResponseSchema = z.object({
	facets: z.array(facetSchema),
	ranges: z.array(
		z.object({
			name: z.string(),
			label: z.string(),
			min: z.number().optional(),
			max: z.number().optional(),
			unit: z.string().optional(),
		}),
	),
	sort: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
});
export type FacetsResponse = z.infer<typeof facetsResponseSchema>;

/** Filtro ativo na tela. `range` com qualquer ponta opcional. */
export type ActiveFilter =
	| { kind: 'eq'; value: string | number }
	| { kind: 'range'; min?: number; max?: number };

export interface CollectionQuery {
	filters?: Record<string, ActiveFilter>;
	q?: string;
	sort?: string;
	page?: number;
	pageSize?: number;
	mine?: boolean;
}

/**
 * Serializa os filtros no formato que o back espera: `f.<campo>=valor` para
 * exato e `f.<campo>=min..max` para faixa (qualquer ponta pode faltar).
 */
export function toQueryParams(q: CollectionQuery): Record<string, string> {
	const params: Record<string, string> = {};
	if (q.q) params.q = q.q;
	if (q.sort) params.sort = q.sort;
	if (q.page) params.page = String(q.page);
	if (q.pageSize) params.page_size = String(q.pageSize);
	if (q.mine) params.mine = 'true';
	for (const [field, f] of Object.entries(q.filters ?? {})) {
		params[`f.${field}`] =
			f.kind === 'eq' ? String(f.value) : `${f.min ?? ''}..${f.max ?? ''}`;
	}
	return params;
}

const base = (key: string, collection: string) =>
	`/api/tools/${encodeURIComponent(key)}/c/${encodeURIComponent(collection)}`;

export async function listCollection(
	key: string,
	collection: string,
	query: CollectionQuery = {},
): Promise<CollectionList> {
	const { data } = await api.get(base(key, collection), {
		params: toQueryParams(query),
	});
	return collectionListSchema.parse(data);
}

export async function getCollectionFacets(
	key: string,
	collection: string,
	query: CollectionQuery = {},
): Promise<FacetsResponse> {
	const { data } = await api.get(`${base(key, collection)}/facets`, {
		params: toQueryParams(query),
	});
	return facetsResponseSchema.parse(data);
}

export async function getCollectionEntry(
	key: string,
	collection: string,
	id: string,
): Promise<CollectionEntry> {
	const { data } = await api.get(`${base(key, collection)}/${id}`);
	return collectionEntrySchema.parse(data);
}

export async function findNearest(
	key: string,
	collection: string,
	target: Record<string, number>,
	group: Record<string, string> = {},
	limit = 5,
): Promise<{ items: CollectionEntry[] }> {
	const { data } = await api.get(`${base(key, collection)}/nearest`, {
		params: { ...target, ...group, limit },
	});
	return { items: z.array(collectionEntrySchema).parse(data?.items ?? []) };
}

/**
 * A LINHAGEM de um registro: de onde ele veio e o que saiu dele.
 *
 * ┌─ POR QUE UM ENDPOINT, E NÃO UM FILTRO NA LISTAGEM ──────────────────────┐
 * │ A listagem só filtra por campo declarado como FACETA, e `parent_id` não  │
 * │ pode ser faceta: viraria um dicionário com uma entrada por arte da base.  │
 * │ E a pergunta da tela é uma só — "abri esta arte, me mostre a corrente" —, │
 * │ que respondida em três requisições faria a galeria piscar em três tempos. │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * UM NÍVEL para cada lado: é o que a tela desenha (uma seta para trás, uma
 * fileira para a frente). A árvore inteira sai de navegar, um clique por vez.
 *
 * `parent` pode ser `null` com o registro tendo `parent_id`: o pai foi apagado.
 * É estado normal, não erro — a tela diz "a origem não está mais na galeria".
 */
export const collectionLineageSchema = z.object({
	item: collectionEntrySchema,
	parent: collectionEntrySchema.nullable(),
	children: z.array(collectionEntrySchema).default([]),
});
export type CollectionLineage = z.infer<typeof collectionLineageSchema>;

export async function getCollectionLineage(
	key: string,
	collection: string,
	id: string,
): Promise<CollectionLineage> {
	const { data } = await api.get(`${base(key, collection)}/${id}/lineage`);
	return collectionLineageSchema.parse(data);
}

export async function createCollectionEntry(
	key: string,
	collection: string,
	body: {
		title: string;
		description?: string;
		category?: string;
		data: Record<string, unknown>;
		/**
		 * A visibilidade PEDIDA. O back fica com a opção mais fechada entre ela e a
		 * que a coleção declara — mas só onde há declaração; sem ela, o padrão do
		 * back é `public`. `lib/collection-form.ts` → `visibilityOf()` escolhe.
		 */
		visibility?: 'public' | 'owner' | 'staff';
	},
): Promise<CollectionEntry> {
	const { data } = await api.post(base(key, collection), body);
	return collectionEntrySchema.parse(data);
}

export async function updateCollectionEntry(
	key: string,
	collection: string,
	id: string,
	body: Record<string, unknown>,
): Promise<CollectionEntry> {
	const { data } = await api.patch(`${base(key, collection)}/${id}`, body);
	return collectionEntrySchema.parse(data);
}

export async function deleteCollectionEntry(
	key: string,
	collection: string,
	id: string,
): Promise<void> {
	await api.delete(`${base(key, collection)}/${id}`);
}

/**
 * Uma cor dominante do que foi enviado: hex + a FATIA DE ÁREA que ela ocupa
 * (0–1). Espelha `PaletteColor` da main API (`lib/vectorize-color.ts`).
 *
 * `share` é opcional AQUI de propósito: a tela ordena por ela quando vem e
 * continua funcionando quando não vem. Uma prévia de cor não vale um erro de
 * schema em cima de um upload que deu certo.
 */
export const paletteColorSchema = z
	.object({ hex: z.string(), share: z.number().optional() })
	.passthrough();
export type PaletteColor = z.infer<typeof paletteColorSchema>;

/**
 * Sobe uma imagem de um campo `type:'image'` e devolve a URL pública — e, junto,
 * o que o servidor JÁ SABE sobre ela porque acabou de decodificá-la.
 *
 * O campo GUARDA URL, não bytes (`tool-collections.ts` valida com
 * `z.string().url()`), e até a F0 o único endpoint de upload era o do Banco do
 * Admin (`/api/tools/:key/bank/upload-image`, admin-only) — ou seja, um aluno
 * não tinha como preencher campo de imagem nenhum.
 *
 * CONTRATO: multipart com o arquivo em `file`; resposta `{ url, width, height,
 * palette }`. A `palette` é a razão de existir deste formato: o endpoint já tem
 * os pixels na mão, então as cores dominantes saem no MESMO round-trip — a tela
 * da marca pré-preenche as cores em vez de perguntar "qual é a sua cor
 * primária?" em hexadecimal.
 *
 * TUDO ALÉM DA `url` É OPCIONAL no schema. Enquanto o back não devolver a
 * paleta, quem consome mostra só o que tem; e enquanto a rota não existir, a
 * chamada volta 404 e o campo de imagem oferece colar o endereço.
 */
export const uploadedImageSchema = z
	.object({
		url: z.string(),
		width: z.number().optional(),
		height: z.number().optional(),
		palette: z.array(paletteColorSchema).optional(),
	})
	.passthrough();
export type UploadedImage = z.infer<typeof uploadedImageSchema>;

export async function uploadCollectionImage(
	key: string,
	collection: string,
	file: File,
): Promise<UploadedImage> {
	const fd = new FormData();
	fd.append('file', file);
	const { data } = await api.post(`${base(key, collection)}/upload-image`, fd);
	return uploadedImageSchema.parse(data);
}

export async function reviewCollectionEntry(
	key: string,
	collection: string,
	id: string,
	status: 'approved' | 'rejected',
	reviewNote?: string,
): Promise<CollectionEntry> {
	const { data } = await api.post(`${base(key, collection)}/${id}/review`, {
		status,
		review_note: reviewNote,
	});
	return collectionEntrySchema.parse(data);
}

export async function sendCollectionFeedback(
	key: string,
	collection: string,
	id: string,
	body: {
		kind: 'like' | 'save' | 'rating' | 'result';
		value?: number;
		outcome?: string;
		payload?: Record<string, unknown>;
		note?: string;
		remove?: boolean;
	},
): Promise<CollectionEntry> {
	const { data } = await api.post(
		`${base(key, collection)}/${id}/feedback`,
		body,
	);
	return collectionEntrySchema.parse(data);
}

/**
 * Só `resposta` é exigida.
 *
 * O servidor conta a pergunta ANTES de responder — a cota é debitada lá,
 * mesmo que a gravação do histórico falhe. Um schema estrito transformaria
 * qualquer campo ausente numa exceção, e o aluno veria "não consegui
 * responder" logo depois de perder a pergunta e ter a resposta pronta do
 * outro lado. O saldo é enfeite; o texto é o que ele comprou.
 */
export const perguntaRespostaSchema = z
	.object({
		resposta: z.string(),
		restantes: z.number().optional(),
		total: z.number().optional(),
	})
	.passthrough();
export type PerguntaResposta = z.infer<typeof perguntaRespostaSchema>;

/**
 * Pergunta em cima de um registro já salvo (o dossiê da Central de
 * Inteligência, hoje). As perguntas são CONTADAS e vêm incluídas na análise que
 * o aluno já pagou — por isso a resposta devolve o saldo, e não só o texto.
 */
export async function perguntarSobreEntry(
	key: string,
	collection: string,
	id: string,
	pergunta: string,
): Promise<PerguntaResposta> {
	const { data } = await api.post(`${base(key, collection)}/${id}/perguntar`, {
		pergunta,
	});
	return perguntaRespostaSchema.parse(data);
}

export async function importCollection(
	key: string,
	collection: string,
	csv: string,
): Promise<{ imported: number }> {
	const { data } = await api.post(`${base(key, collection)}/import`, { csv });
	return data as { imported: number };
}
