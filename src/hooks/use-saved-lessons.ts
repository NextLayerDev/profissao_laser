'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	getSavedLessons,
	removeSavedLesson,
	saveLesson,
} from '@/services/saved-lessons';
import { getToken } from '@/shared/lib/auth';

const SAVED_LESSONS_KEY = ['saved-lessons'] as const;

export function useSavedLessons() {
	const isLoggedIn = !!getToken();

	return useQuery({
		queryKey: SAVED_LESSONS_KEY,
		queryFn: getSavedLessons,
		enabled: isLoggedIn,
	});
}

export function useSaveLesson() {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: saveLesson,
		onSuccess: () => qc.invalidateQueries({ queryKey: SAVED_LESSONS_KEY }),
	});
}

export function useRemoveSavedLesson() {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: removeSavedLesson,
		onSuccess: () => qc.invalidateQueries({ queryKey: SAVED_LESSONS_KEY }),
	});
}
