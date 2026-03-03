'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getLessonRating, submitLessonRating } from '@/services/ratings';

const key = (lessonId: string) => ['rating', lessonId];

export function useLessonRating(lessonId: string) {
	return useQuery({
		queryKey: key(lessonId),
		queryFn: () => getLessonRating(lessonId),
		enabled: !!lessonId,
	});
}

export function useSubmitRating(lessonId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (stars: number) => submitLessonRating(lessonId, { stars }),
		onSuccess: () => qc.invalidateQueries({ queryKey: key(lessonId) }),
	});
}
