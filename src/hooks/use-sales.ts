'use client';

import { useQuery } from '@tanstack/react-query';
import { getSales } from '@/services/sales';
import type { Sales } from '@/types/sales';

export function useSales() {
	const { data, error, isLoading } = useQuery({
		queryKey: ['sales'],
		queryFn: getSales,
	});

	return {
		sales: data as Sales[],
		error,
		isLoading,
	};
}
