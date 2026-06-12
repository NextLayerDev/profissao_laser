'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { listLessonsIndex } from '@/modules/courses/services/lessons.service';
import type { LessonIndexEntry } from '@/modules/courses/types/lessons';
import { getAdminLessonDoubts, replyToDoubt } from '@/services/doubts';
import type { AdminLessonDoubtsStatus } from '@/types/doubts';

/**
 * Dúvidas de aula para o staff em UMA chamada agregada (GET /doubts/admin),
 * substituindo o antigo fluxo que varria produto → curso → módulos → aulas.
 */
export function useAdminLessonDoubts(
	params: { status: AdminLessonDoubtsStatus; page: number; limit?: number },
	enabled = true,
) {
	const limit = params.limit ?? 30;
	return useQuery({
		queryKey: ['admin-lesson-doubts', params.status, params.page, limit],
		queryFn: () =>
			getAdminLessonDoubts({ status: params.status, page: params.page, limit }),
		enabled,
		refetchInterval: 60_000,
	});
}

/**
 * Índice plano lessonId → { aula, módulo, curso } (1 chamada, cache longo) —
 * dá contexto às dúvidas sem navegar a árvore de cursos.
 */
export function useLessonsIndexMap(enabled = true) {
	const query = useQuery({
		queryKey: ['lessons-index'],
		queryFn: listLessonsIndex,
		enabled,
		staleTime: 10 * 60_000,
	});

	const map = useMemo(() => {
		const m = new Map<string, LessonIndexEntry>();
		for (const entry of query.data ?? []) {
			m.set(entry.id, entry);
		}
		return m;
	}, [query.data]);

	return { ...query, map };
}

export function useReplyToLessonDoubt() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ doubtId, content }: { doubtId: string; content: string }) =>
			replyToDoubt(doubtId, content),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['admin-lesson-doubts'] });
			qc.invalidateQueries({ queryKey: ['admin-pendings', 'lesson-doubts'] });
			qc.invalidateQueries({ queryKey: ['doubts'] });
		},
	});
}
