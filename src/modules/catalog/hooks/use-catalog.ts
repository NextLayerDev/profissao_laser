'use client';

import { useQuery } from '@tanstack/react-query';
import {
	getPublicCourse,
	listCoursePlans,
	listPublicCourses,
} from '../services/catalog.service';

export const catalogQueryKeys = {
	courses: ['catalog', 'courses'] as const,
	course: (slug: string) => ['catalog', 'course', slug] as const,
	coursePlans: (slug: string) => ['catalog', 'course', slug, 'plans'] as const,
};

export function usePublicCourses() {
	return useQuery({
		queryKey: catalogQueryKeys.courses,
		queryFn: listPublicCourses,
	});
}

export function usePublicCourse(slug: string) {
	return useQuery({
		queryKey: catalogQueryKeys.course(slug),
		queryFn: () => getPublicCourse(slug),
		enabled: !!slug,
	});
}

export function useCoursePlans(slug: string) {
	return useQuery({
		queryKey: catalogQueryKeys.coursePlans(slug),
		queryFn: () => listCoursePlans(slug),
		enabled: !!slug,
	});
}
