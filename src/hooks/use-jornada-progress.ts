'use client';

import { useQueries } from '@tanstack/react-query';
import { getCourse } from '@/services/course';
import { getCourseProgress } from '@/services/progress';
import type { Course } from '@/types/course';
import type { CustomerPlan } from '@/types/plans';

export interface JornadaCourseItem {
	plan: CustomerPlan;
	course: Course;
	watchedCount: number;
	totalLessons: number;
	percentage: number;
	watchedLessons: { id: string; title: string }[];
	nextLessonId: string | null;
}

function buildJornadaItem(
	plan: CustomerPlan,
	course: Course,
	watchedIds: string[],
): JornadaCourseItem {
	const sortedModules = [...course.modules].sort((a, b) => a.order - b.order);
	const allLessons = sortedModules.flatMap((m) =>
		[...m.lessons]
			.sort((a, b) => a.order - b.order)
			.map((l) => ({ id: l.id, title: l.title })),
	);
	const totalLessons = allLessons.length;
	const watchedSet = new Set(watchedIds);
	const watchedLessons = allLessons
		.filter((l) => watchedSet.has(l.id))
		.map((l) => ({ id: l.id, title: l.title }));
	const watchedCount = watchedLessons.length;
	const percentage =
		totalLessons > 0 ? Math.round((watchedCount / totalLessons) * 100) : 0;
	const nextLesson = allLessons.find((l) => !watchedSet.has(l.id)) ?? null;

	return {
		plan,
		course,
		watchedCount,
		totalLessons,
		percentage,
		watchedLessons,
		nextLessonId: nextLesson?.id ?? null,
	};
}

export function useJornadaProgress(plans: CustomerPlan[] | undefined) {
	const plansWithSlug = (plans ?? []).filter(
		(p): p is CustomerPlan & { slug: string } => !!p.slug,
	);

	// Deduplica por slug para evitar mostrar o mesmo curso várias vezes
	const seenSlugs = new Set<string>();
	const uniquePlans = plansWithSlug.filter((p) => {
		if (seenSlugs.has(p.slug)) return false;
		seenSlugs.add(p.slug);
		return true;
	});

	const queries = useQueries({
		queries: uniquePlans.map((plan) => ({
			queryKey: ['jornada-progress', plan.id, plan.slug],
			queryFn: async (): Promise<JornadaCourseItem> => {
				const course = await getCourse(plan.slug);
				const progress = await getCourseProgress(course.id);
				return buildJornadaItem(plan, course, progress.watchedLessonIds);
			},
		})),
	});

	const isLoading = queries.some((q) => q.isLoading);
	const items: JornadaCourseItem[] = queries
		.filter((q): q is typeof q & { data: JornadaCourseItem } => !!q.data)
		.map((q) => q.data);
	const errors = queries.filter((q) => q.isError);

	return { items, isLoading, errors };
}
