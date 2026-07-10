'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { catalogQueryKeys } from '@/modules/catalog/hooks/use-catalog';
import { listPublicCourses } from '@/modules/catalog/services/catalog.service';
import {
	listLessonsIndex,
	updateLesson,
} from '@/modules/courses/services/lessons.service';
import type { LessonIndexEntry } from '@/modules/courses/types/lessons';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { listFreeLessons } from '../services/free-lessons.service';
import { lessonsQueryKeys } from './use-free-lessons';

export interface FreeLessonAdminEntry extends LessonIndexEntry {
	is_free: boolean;
}

export interface FreeLessonAdminCourseGroup {
	course: LessonIndexEntry['course'] & { image_url?: string | null };
	lessons: FreeLessonAdminEntry[];
	freeCount: number;
}

/**
 * Cruza o índice plano de aulas (staff) com a lista pública de aulas grátis
 * para saber, aula a aula, se ela está liberada — sem exigir mudança de
 * backend, já que `/v1/admin/lessons-index` não expõe `is_free`.
 */
export function useAdminFreeLessons() {
	const indexQuery = useQuery({
		queryKey: ['lessons-index'],
		queryFn: listLessonsIndex,
		staleTime: 10 * 60_000,
	});
	const freeQuery = useQuery({
		queryKey: lessonsQueryKeys.free,
		queryFn: listFreeLessons,
		staleTime: 60_000,
	});
	// Reaproveita a vitrine pública só pra pegar a imagem do curso (o índice de
	// aulas do staff não expõe image_url).
	const coursesQuery = useQuery({
		queryKey: catalogQueryKeys.courses,
		queryFn: listPublicCourses,
		staleTime: 10 * 60_000,
	});

	const groups = useMemo(() => {
		const freeIds = new Set((freeQuery.data ?? []).map((l) => l.id));
		const imageByCourse = new Map(
			(coursesQuery.data ?? []).map((c) => [c.id, c.image_url]),
		);
		const byCourse = new Map<string, FreeLessonAdminCourseGroup>();

		for (const entry of indexQuery.data ?? []) {
			const key = entry.course.id;
			if (!byCourse.has(key)) {
				byCourse.set(key, {
					course: { ...entry.course, image_url: imageByCourse.get(key) },
					lessons: [],
					freeCount: 0,
				});
			}
			const group = byCourse.get(key);
			if (!group) continue;
			const is_free = freeIds.has(entry.id);
			group.lessons.push({ ...entry, is_free });
			if (is_free) group.freeCount += 1;
		}

		for (const group of byCourse.values()) {
			group.lessons.sort((a, b) => {
				if (a.module.position !== b.module.position) {
					return a.module.position - b.module.position;
				}
				return a.position - b.position;
			});
		}

		return Array.from(byCourse.values()).sort((a, b) =>
			a.course.title.localeCompare(b.course.title),
		);
	}, [indexQuery.data, freeQuery.data, coursesQuery.data]);

	const totalLessons = indexQuery.data?.length ?? 0;
	const totalFree = freeQuery.data?.length ?? 0;

	return {
		groups,
		totalLessons,
		totalFree,
		isLoading: indexQuery.isLoading || freeQuery.isLoading,
		isError: indexQuery.isError || freeQuery.isError,
	};
}

export function useToggleLessonFree() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, is_free }: { id: string; is_free: boolean }) =>
			updateLesson(id, { is_free }),
		onSuccess: (_data, variables) => {
			qc.invalidateQueries({ queryKey: ['lessons-index'] });
			qc.invalidateQueries({ queryKey: lessonsQueryKeys.free });
			toast.success(
				variables.is_free
					? 'Lição liberada como grátis'
					: 'Lição não é mais grátis',
			);
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao atualizar a lição')),
	});
}
