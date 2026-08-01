'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
	runToolPreview,
	type ToolDefinitionDoc,
	type ToolInputSpec,
} from '../services/tool-definitions.service';

/**
 * Preview AO VIVO do estúdio (espelho do `useVectorizePreview`): debounce 400ms
 * nos valores, mantém a imagem anterior enquanto recalcula (sem flicker) e NÃO
 * dá retry — o run final cobrado é o `runToolEngine`. Roda no endpoint não
 * cobrado `/preview`.
 *
 * O arquivo só é EXIGIDO quando a tool declara um input de arquivo. Uma tool de
 * CAD paramétrico não tem imagem de entrada — o desenho nasce dos sliders —, e
 * com o gate antigo (`&& !!file`) ela nunca chamava o preview: o viewport 3D
 * ficava vazio até o run cobrado, que é exatamente o que o preview existe pra
 * evitar.
 */
export function useToolPreview(
	toolKey: string,
	values: Record<string, unknown>,
	inputSpec: Record<string, ToolInputSpec>,
	opts: { enabled: boolean; draftDefinition?: ToolDefinitionDoc },
) {
	const debounced = useDebouncedValue(values, 400);

	// A imagem (1º File nos valores) define a `fileKey`; key e payload saem ambos
	// do mesmo objeto debounced pra não dessincronizar.
	const file = (Object.values(debounced).find(
		(v): v is File => v instanceof File,
	) ?? null) as File | null;
	const fileKey = file
		? `${file.name}:${file.size}:${file.lastModified}`
		: 'none';
	const exigeArquivo = Object.values(inputSpec).some(
		(s) => s.type === 'image' || s.type === 'file',
	);
	const paramsKey = JSON.stringify(
		Object.fromEntries(
			Object.entries(debounced).filter(([, v]) => !(v instanceof File)),
		),
	);

	return useQuery({
		queryKey: ['tool-preview', toolKey, fileKey, paramsKey],
		queryFn: () =>
			runToolPreview(toolKey, {
				values: debounced,
				inputSpec,
				draftDefinition: opts.draftDefinition,
			}),
		enabled: opts.enabled && (!!file || !exigeArquivo),
		staleTime: 5 * 60_000,
		placeholderData: keepPreviousData,
		retry: false,
	});
}
