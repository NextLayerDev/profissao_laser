'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listAdminCourses } from '@/modules/courses';
import { getCourse } from '@/services/course';
import { getLessonDoubts, replyToDoubt } from '@/services/doubts';
import { getProducts } from '@/services/products';
import type { Course, CourseLesson, CourseModule } from '@/types/course';
import type { Doubt } from '@/types/doubts';
import type { Product } from '@/types/products';

export interface LessonWithDoubts extends CourseLesson {
	doubts: Doubt[];
}

export interface ModuleWithDoubts extends CourseModule {
	lessons: LessonWithDoubts[];
}

export interface ProductWithDoubts {
	product: Product;
	course: Course;
	modules: ModuleWithDoubts[];
}

async function fetchDoubtsByModules(): Promise<ProductWithDoubts[]> {
	const [products, courses] = await Promise.all([
		getProducts(),
		listAdminCourses(),
	]);
	// Só processa produtos cujo slug tem curso real na upvox (fonte de verdade),
	// evitando 404 em GET /v1/course/:slug para produtos sem curso correspondente.
	const courseSlugs = new Set(courses.map((c) => c.slug));
	const cursoProducts = products.filter(
		(p) => p.type === 'curso' && courseSlugs.has(p.slug),
	);

	const result: ProductWithDoubts[] = [];

	for (const product of cursoProducts) {
		try {
			const course = await getCourse(product.slug);
			const modules: ModuleWithDoubts[] = course.modules.map((mod) => ({
				...mod,
				lessons: mod.lessons.map((lesson) => ({
					...lesson,
					doubts: [] as Doubt[],
				})),
			}));

			result.push({ product, course, modules });
		} catch {
			// Skip product if course fails to load
		}
	}

	return result;
}

export function useDoubtsByModules(enabled: boolean) {
	return useQuery({
		queryKey: ['admin-doubts'] as const,
		queryFn: fetchDoubtsByModules,
		enabled,
	});
}

export type ModuleDoubtsMap = Record<string, Doubt[]>;

export async function fetchModuleDoubts(
	lessonIds: string[],
): Promise<ModuleDoubtsMap> {
	if (lessonIds.length === 0) return {};
	const results = await Promise.all(
		lessonIds.map(async (id) => {
			try {
				return await getLessonDoubts(id);
			} catch {
				return [] as Doubt[];
			}
		}),
	);
	return Object.fromEntries(lessonIds.map((id, i) => [id, results[i]]));
}

export function useModuleDoubts(lessonIds: string[], enabled: boolean) {
	return useQuery({
		queryKey: ['module-doubts', [...lessonIds].sort().join(',')] as const,
		queryFn: () => fetchModuleDoubts(lessonIds),
		enabled: enabled && lessonIds.length > 0,
	});
}

export function useReplyToDoubt() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ doubtId, content }: { doubtId: string; content: string }) =>
			replyToDoubt(doubtId, content),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['admin-doubts'] });
			qc.invalidateQueries({ queryKey: ['doubts'] });
			qc.invalidateQueries({ queryKey: ['module-doubts'] });
		},
	});
}
