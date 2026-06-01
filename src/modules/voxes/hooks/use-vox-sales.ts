'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listVoxSales } from '../services/voxes.service';
import type { ListVoxSalesParams } from '../types/voxes';

export const voxSalesQueryKey = (params: ListVoxSalesParams) =>
	['voxes', 'sales', params] as const;

export function useVoxSales(params: ListVoxSalesParams = {}) {
	return useQuery({
		queryKey: voxSalesQueryKey(params),
		queryFn: () => listVoxSales(params),
		placeholderData: keepPreviousData,
	});
}
