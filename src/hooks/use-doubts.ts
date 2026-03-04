'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GetDoubtsParams } from '@/services/doubts';
import { createDoubt, getLessonDoubts } from '@/services/doubts';

const key = (lessonId: string, params?: GetDoubtsParams) =>
	['doubts', lessonId, params?.page, params?.limit] as const;

export function useLessonDoubts(lessonId: string, params?: GetDoubtsParams) {
	return useQuery({
		queryKey: key(lessonId, params),
		queryFn: () => getLessonDoubts(lessonId, params),
		enabled: !!lessonId,
	});
}

export function useCreateDoubt(lessonId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (content: string) => createDoubt(lessonId, content),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['doubts', lessonId] });
		},
	});
}
