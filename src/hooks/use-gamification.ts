'use client';

import { useQuery } from '@tanstack/react-query';
import { getStreak } from '@/services/gamification';

const QUERY_KEY = ['gamification'] as const;

export function useStreak() {
	return useQuery({
		queryKey: [...QUERY_KEY, 'streak'] as const,
		queryFn: getStreak,
	});
}
