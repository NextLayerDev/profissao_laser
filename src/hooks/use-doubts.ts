'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createLessonDoubt, getLessonDoubts } from '@/services/doubts';

const key = (lessonId: string) => ['doubts', lessonId];

export function useDoubts(lessonId: string) {
	return useQuery({
		queryKey: key(lessonId),
		queryFn: () => getLessonDoubts(lessonId),
		enabled: !!lessonId,
	});
}

export function useCreateDoubt(lessonId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (content: string) => createLessonDoubt(lessonId, { content }),
		onSuccess: () => qc.invalidateQueries({ queryKey: key(lessonId) }),
	});
}
