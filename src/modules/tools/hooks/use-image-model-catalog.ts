'use client';

import { useQuery } from '@tanstack/react-query';
import type { ImageModelCatalog } from '../services/image-models.service';
import { listImageModels } from '../services/image-models.service';

/**
 * Hook do catálogo curado de modelos de imagem. Cache 1h (bate com o TTL do
 * endpoint e do cache in-process no main API).
 */
export const imageModelsCatalogQueryKey = ['image-models-catalog'] as const;

export function useImageModelCatalog() {
	return useQuery<ImageModelCatalog>({
		queryKey: imageModelsCatalogQueryKey,
		queryFn: () => listImageModels(),
		staleTime: 60 * 60 * 1000,
		gcTime: 2 * 60 * 60 * 1000,
	});
}
