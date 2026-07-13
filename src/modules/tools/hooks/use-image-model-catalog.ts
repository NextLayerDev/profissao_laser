'use client';

import { useQuery } from '@tanstack/react-query';
import type { ImageModelCatalog } from '../services/image-models.service';
import { listImageModels } from '../services/image-models.service';

/**
 * Hook do catálogo curado de modelos de imagem. Sempre revalida ao montar
 * (`staleTime: 0` + endpoint `no-store`) pra que edições do catálogo pelo staff
 * apareçam no dropdown na hora — antes um cache de 1h escondia mudanças.
 */
export const imageModelsCatalogQueryKey = ['image-models-catalog'] as const;

export function useImageModelCatalog() {
	return useQuery<ImageModelCatalog>({
		queryKey: imageModelsCatalogQueryKey,
		queryFn: () => listImageModels(),
		staleTime: 0,
		gcTime: 30 * 60 * 1000,
		refetchOnMount: 'always',
	});
}
