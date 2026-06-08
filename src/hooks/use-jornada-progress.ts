'use client';

import { useQuery } from '@tanstack/react-query';
import { listModuleLessons } from '@/modules/courses/services/lessons.service';
import { listCourseModules } from '@/modules/courses/services/modules.service';
import type { CustomerPlan } from '@/types/plans';

export interface JornadaCourseItem {
	plan: CustomerPlan;
	course: { id: string; name: string; slug: string; image: string | null };
	watchedCount: number;
	totalLessons: number;
	percentage: number;
	watchedLessons: { id: string; title: string }[];
	nextLessonId: string | null;
}

async function fetchLessonCount(
	plan: CustomerPlan & { slug: string },
): Promise<JornadaCourseItem> {
	const modules = await listCourseModules(plan.slug);
	const sorted = [...modules].sort((a, b) => a.position - b.position);
	const lessonsPerModule = await Promise.all(
		sorted.map((m) => listModuleLessons(m.id)),
	);

	const allLessons = sorted.flatMap((_, i) =>
		[...(lessonsPerModule[i] ?? [])]
			.sort((a, b) => a.position - b.position)
			.map((l) => ({ id: l.id, title: l.title })),
	);

	return {
		plan,
		course: {
			id: plan.id,
			name: plan.product_name,
			slug: plan.slug,
			image: null,
		},
		watchedCount: 0,
		totalLessons: allLessons.length,
		percentage: 0,
		watchedLessons: [],
		nextLessonId: allLessons[0]?.id ?? null,
	};
}

export function useJornadaProgress(plans: CustomerPlan[] | undefined) {
	const plansWithSlug = (plans ?? []).filter(
		(p): p is CustomerPlan & { slug: string } => !!p.slug,
	);

	const seenSlugs = new Set<string>();
	const uniquePlans = plansWithSlug.filter((p) => {
		if (seenSlugs.has(p.slug)) return false;
		seenSlugs.add(p.slug);
		return true;
	});

	// Um único useQuery (hook count estável) que busca todos os cursos em paralelo.
	// useQueries com array dinâmico viola Rules of Hooks ao mudar de 0 → N queries.
	const planKey = uniquePlans.map((p) => p.id).join(',');
	const { data: items = [], isLoading } = useQuery<JornadaCourseItem[]>({
		queryKey: ['jornada-lessons', planKey],
		queryFn: () => Promise.all(uniquePlans.map(fetchLessonCount)),
		enabled: uniquePlans.length > 0,
		staleTime: 5 * 60_000,
		retry: 1,
	});

	return { items, isLoading, errors: [] };
}
