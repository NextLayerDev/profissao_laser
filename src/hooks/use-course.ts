'use client';

import { useQuery } from '@tanstack/react-query';
import { getCourse } from '@/services/course';

export function useCourse(slug: string) {
	return useQuery({
		queryKey: ['course', slug],
		queryFn: () => getCourse(slug),
		enabled: !!slug,
	});
}
