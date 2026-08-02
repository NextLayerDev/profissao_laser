'use client';

import { useQuery } from '@tanstack/react-query';
import type { TextModelCatalog } from '../services/text-models.service';
import { listTextModels } from '../services/text-models.service';

/**
 * Catálogo curado de modelos de texto. Revalida sempre ao montar
 * (`staleTime: 0` + endpoint `no-store`), pelo mesmo motivo do de imagem: uma
 * edição do catálogo pelo staff precisa aparecer no dropdown na hora, e um
 * cache longo escondia a mudança.
 */
export const textModelsCatalogQueryKey = ['text-models-catalog'] as const;

export function useTextModelCatalog() {
	return useQuery<TextModelCatalog>({
		queryKey: textModelsCatalogQueryKey,
		queryFn: () => listTextModels(),
		staleTime: 0,
		gcTime: 30 * 60 * 1000,
		refetchOnMount: 'always',
	});
}
