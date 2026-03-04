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
		queryFn: () => getCourseProgress(courseId!),
		enabled: !!courseId,
	});

	const mutation = useMutation({
		mutationFn: (lessonId: string) => markLessonComplete(lessonId),
		onSuccess: (_, lessonId) => {
			if (!courseId) return;
			queryClient.setQueryData<CourseProgress>(
				progressKey(courseId),
				(prev) => {
					const ids = prev?.watchedLessonIds ?? [];
					if (ids.includes(lessonId)) return prev;
					return { watchedLessonIds: [...ids, lessonId] };
				},
			);
			queryClient.invalidateQueries({ queryKey: progressKey(courseId) });
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
