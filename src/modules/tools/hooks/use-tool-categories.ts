'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { setCategoryRegistry } from '../lib/tool-categories';
import {
	type CreateToolCategoryInput,
	createCategory,
	deleteCategory,
	listCategories,
	reorderCategories,
	type ToolCategoryDTO,
	type UpdateToolCategoryInput,
	updateCategory,
} from '../services/tool-categories.service';

/** Chave da query da lista de categorias dinâmicas. */
export const TOOL_CATEGORIES_KEY = ['tool-categories'] as const;

/**
 * Lê as categorias dinâmicas (upvox) e ALIMENTA o registry de `tool-categories.ts`
 * sempre que os dados mudam — assim os helpers puros (`categoryById`/`Section`/
 * `Color`) passam a resolver as categorias customizadas, e o catálogo re-renderiza
 * (o registry muda + a query muda → `useToolCatalog` recompõe).
 *
 * Devolve as categorias JÁ ORDENADAS por `order_index` (e desempate por `label`)
 * e as mutações de CRUD/reorder, todas invalidando `['tool-categories']` e
 * `['tool-definitions']` (a categoria de uma tool mora na definition).
 */
export function useToolCategories() {
	const qc = useQueryClient();

	const { data, isLoading } = useQuery<ToolCategoryDTO[]>({
		queryKey: TOOL_CATEGORIES_KEY,
		queryFn: listCategories,
		staleTime: 60_000,
	});

	const categories = useMemo<ToolCategoryDTO[]>(
		() =>
			[...(data ?? [])].sort((a, b) => {
				if (a.order_index !== b.order_index) {
					return a.order_index - b.order_index;
				}
				return a.label.localeCompare(b.label);
			}),
		[data],
	);

	// ON DATA: espelha as categorias no registry de módulo (resolução dinâmica
	// dos helpers puros). Roda a cada mudança da lista; `[]` apenas zera (legado).
	useEffect(() => {
		setCategoryRegistry(categories);
	}, [categories]);

	const invalidate = () => {
		qc.invalidateQueries({ queryKey: TOOL_CATEGORIES_KEY });
		qc.invalidateQueries({ queryKey: ['tool-definitions'] });
	};

	const create = useMutation({
		mutationFn: (body: CreateToolCategoryInput) => createCategory(body),
		onSuccess: invalidate,
	});

	const update = useMutation({
		mutationFn: ({ id, body }: { id: string; body: UpdateToolCategoryInput }) =>
			updateCategory(id, body),
		onSuccess: invalidate,
	});

	const remove = useMutation({
		mutationFn: (id: string) => deleteCategory(id),
		onSuccess: invalidate,
	});

	const reorder = useMutation({
		mutationFn: (ids: string[]) => reorderCategories(ids),
		onSuccess: invalidate,
	});

	return { categories, isLoading, create, update, remove, reorder };
}
