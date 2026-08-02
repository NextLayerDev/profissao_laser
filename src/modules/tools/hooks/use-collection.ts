'use client';

import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import {
	type ActiveFilter,
	type CollectionQuery,
	getCollectionFacets,
	listCollection,
	reviewCollectionEntry,
	sendCollectionFeedback,
} from '../services/collections.service';

/**
 * Estado da tela de catálogo: filtros, busca, ordenação e página, mais as duas
 * queries (itens e facetas) e as mutações de feedback/moderação.
 *
 * `keepPreviousData` nas duas: sem ele, cada clique num filtro pisca a tela
 * inteira para o esqueleto. Com ele, a lista antiga fica visível em opacidade
 * reduzida enquanto a nova chega — que é o que faz um catálogo parecer rápido.
 */
export function useCollection(toolKey: string, collection: string) {
	const qc = useQueryClient();
	const [filters, setFilters] = useState<Record<string, ActiveFilter>>({});
	const [q, setQ] = useState('');
	const [sort, setSort] = useState<string>('score');
	const [page, setPage] = useState(1);
	const [mine, setMine] = useState(false);

	const query: CollectionQuery = useMemo(
		() => ({ filters, q: q.trim() || undefined, sort, page, mine }),
		[filters, q, sort, page, mine],
	);

	const list = useQuery({
		queryKey: ['collection', toolKey, collection, query],
		queryFn: () => listCollection(toolKey, collection, query),
		placeholderData: keepPreviousData,
		staleTime: 30_000,
	});

	// As facetas dependem dos filtros das OUTRAS facetas, não da página nem da
	// ordenação — repetir a chamada ao paginar seria desperdício puro.
	const facetQuery = useMemo(
		() => ({ filters, q: q.trim() || undefined, mine }),
		[filters, q, mine],
	);
	const facets = useQuery({
		queryKey: ['collection-facets', toolKey, collection, facetQuery],
		queryFn: () => getCollectionFacets(toolKey, collection, facetQuery),
		placeholderData: keepPreviousData,
		staleTime: 60_000,
	});

	const invalidate = useCallback(() => {
		qc.invalidateQueries({ queryKey: ['collection', toolKey, collection] });
		qc.invalidateQueries({
			queryKey: ['collection-facets', toolKey, collection],
		});
	}, [qc, toolKey, collection]);

	const feedback = useMutation({
		mutationFn: (v: {
			id: string;
			kind: 'like' | 'save' | 'rating' | 'result';
			value?: number;
			outcome?: string;
			payload?: Record<string, unknown>;
			note?: string;
			remove?: boolean;
		}) => sendCollectionFeedback(toolKey, collection, v.id, v),
		onSuccess: invalidate,
	});

	const review = useMutation({
		mutationFn: (v: {
			id: string;
			status: 'approved' | 'rejected';
			note?: string;
		}) => reviewCollectionEntry(toolKey, collection, v.id, v.status, v.note),
		onSuccess: invalidate,
	});

	/** Liga/desliga uma opção de faceta. Clicar na ativa limpa o filtro. */
	const toggleFilter = useCallback((field: string, value: string | number) => {
		setPage(1);
		setFilters((prev) => {
			const cur = prev[field];
			if (cur?.kind === 'eq' && String(cur.value) === String(value)) {
				const { [field]: _drop, ...rest } = prev;
				return rest;
			}
			return { ...prev, [field]: { kind: 'eq', value } };
		});
	}, []);

	const setRange = useCallback((field: string, min?: number, max?: number) => {
		setPage(1);
		setFilters((prev) => {
			if (min === undefined && max === undefined) {
				const { [field]: _drop, ...rest } = prev;
				return rest;
			}
			return { ...prev, [field]: { kind: 'range', min, max } };
		});
	}, []);

	const clearFilters = useCallback(() => {
		setFilters({});
		setQ('');
		setPage(1);
	}, []);

	const activeCount =
		Object.keys(filters).length + (q.trim() ? 1 : 0) + (mine ? 1 : 0);

	return {
		list,
		facets,
		filters,
		toggleFilter,
		setRange,
		clearFilters,
		activeCount,
		q,
		setQ: (v: string) => {
			setQ(v);
			setPage(1);
		},
		sort,
		setSort: (v: string) => {
			setSort(v);
			setPage(1);
		},
		page,
		setPage,
		mine,
		setMine: (v: boolean) => {
			setMine(v);
			setPage(1);
		},
		feedback,
		review,
		invalidate,
	};
}
