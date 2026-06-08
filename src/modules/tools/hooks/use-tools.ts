'use client';

import { useQuery } from '@tanstack/react-query';
import { listTools } from '../services/tools.service';

export const toolsQueryKey = ['tools'] as const;

export function useTools() {
	return useQuery({
		queryKey: toolsQueryKey,
		queryFn: listTools,
		staleTime: 5 * 60 * 1000,
	});
}
