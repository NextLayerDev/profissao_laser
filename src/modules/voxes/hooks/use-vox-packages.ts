'use client';

import { useQuery } from '@tanstack/react-query';
import { listVoxPackages } from '../services/voxes.service';

export const voxPackagesQueryKey = ['voxes', 'packages'] as const;

export function useVoxPackages() {
	return useQuery({
		queryKey: voxPackagesQueryKey,
		queryFn: listVoxPackages,
		staleTime: 5 * 60 * 1000,
	});
}
