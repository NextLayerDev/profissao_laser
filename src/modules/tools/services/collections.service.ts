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

export async function createCollectionEntry(
	key: string,
	collection: string,
	body: {
		title: string;
		description?: string;
		category?: string;
		data: Record<string, unknown>;
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

export async function importCollection(
	key: string,
	collection: string,
	csv: string,
): Promise<{ imported: number }> {
	const { data } = await api.post(`${base(key, collection)}/import`, { csv });
	return data as { imported: number };
}
