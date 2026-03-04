'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_PREFIX = 'course-progress-';

function getStorageKey(courseId: string) {
	return `${STORAGE_PREFIX}${courseId}`;
}

function loadWatchedIds(courseId: string): Set<string> {
	if (typeof window === 'undefined') return new Set();
	try {
		const raw = localStorage.getItem(getStorageKey(courseId));
		if (!raw) return new Set();
		const arr = JSON.parse(raw) as string[];
		return new Set(Array.isArray(arr) ? arr : []);
	} catch {
		return new Set();
	}
}

function saveWatchedIds(courseId: string, ids: Set<string>) {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(getStorageKey(courseId), JSON.stringify([...ids]));
	} catch {
		// ignore
	}
}

export function useLessonProgress(courseId: string | undefined) {
	const [watchedLessonIds, setWatchedLessonIds] = useState<Set<string>>(() =>
		courseId ? loadWatchedIds(courseId) : new Set(),
	);

	useEffect(() => {
		if (courseId) {
			setWatchedLessonIds(loadWatchedIds(courseId));
		} else {
			setWatchedLessonIds(new Set());
		}
	}, [courseId]);

	const markWatched = useCallback(
		(lessonId: string) => {
			if (!courseId) return;
			setWatchedLessonIds((prev) => {
				if (prev.has(lessonId)) return prev;
				const next = new Set(prev);
				next.add(lessonId);
				saveWatchedIds(courseId, next);
				return next;
			});
		},
		[courseId],
	);

	return { watchedLessonIds, markWatched };
}
