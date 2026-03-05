'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CourseProgress } from '@/services/progress';
import { getCourseProgress, markLessonComplete } from '@/services/progress';

const progressKey = (courseId: string) =>
	['course-progress', courseId] as const;

export function useLessonProgress(courseId: string | undefined) {
	const queryClient = useQueryClient();

	const { data, isLoading } = useQuery({
		queryKey: progressKey(courseId ?? ''),
		queryFn: () =>
			courseId
				? getCourseProgress(courseId)
				: Promise.reject(new Error('No courseId')),
		enabled: !!courseId,
	});

	const mutation = useMutation({
		mutationFn: (lessonId: string) => markLessonComplete(lessonId),
		onMutate: async (lessonId) => {
			if (!courseId) return;
			await queryClient.cancelQueries({ queryKey: progressKey(courseId) });
			const prev = queryClient.getQueryData<CourseProgress>(
				progressKey(courseId),
			);
			queryClient.setQueryData<CourseProgress>(progressKey(courseId), (p) => {
				const ids = p?.watchedLessonIds ?? [];
				if (ids.includes(lessonId)) return p ?? prev;
				return { watchedLessonIds: [...ids, lessonId] };
			});
			return { prev };
		},
		onSuccess: (_, _lessonId) => {
			if (!courseId) return;
			queryClient.invalidateQueries({ queryKey: progressKey(courseId) });
		},
		onError: (_, __, context) => {
			if (courseId && context?.prev) {
				queryClient.setQueryData(progressKey(courseId), context.prev);
			}
		},
	});

	const watchedLessonIds = new Set(data?.watchedLessonIds ?? []);

	const markWatched = (lessonId: string) => {
		if (!courseId) return Promise.resolve();
		return mutation.mutateAsync(lessonId);
	};

	return {
		watchedLessonIds,
		markWatched,
		isLoading,
		isMarkingWatched: mutation.isPending,
	};
}
