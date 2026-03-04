'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
	const products = await getProducts();
	const cursoProducts = products.filter((p) => p.type === 'curso');

	const result: ProductWithDoubts[] = [];

	for (const product of cursoProducts) {
		try {
			const course = await getCourse(product.slug);
			const modules: ModuleWithDoubts[] = [];

			for (const mod of course.modules) {
				const lessonsWithDoubts: LessonWithDoubts[] = await Promise.all(
					mod.lessons.map(async (lesson) => {
						try {
							const doubts = await getLessonDoubts(lesson.id);
							return { ...lesson, doubts };
						} catch {
							return { ...lesson, doubts: [] };
						}
					}),
				);

				modules.push({
					...mod,
					lessons: lessonsWithDoubts,
				});
			}

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

export function useReplyToDoubt() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ doubtId, content }: { doubtId: string; content: string }) =>
			replyToDoubt(doubtId, content),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['admin-doubts'] });
			qc.invalidateQueries({ queryKey: ['doubts'] });
		},
	});
}
