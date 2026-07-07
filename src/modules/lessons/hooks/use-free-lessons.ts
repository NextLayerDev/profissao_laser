'use client';

import { useQuery } from '@tanstack/react-query';
import { listFreeLessons } from '../services/free-lessons.service';

export const lessonsQueryKeys = {
	free: ['lessons', 'free'] as const,
};

export function useFreeLessons() {
	return useQuery({
		queryKey: lessonsQueryKeys.free,
		queryFn: listFreeLessons,
		staleTime: 60_000,
	});
}
