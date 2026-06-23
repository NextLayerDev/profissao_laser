'use client';

import { useQuery } from '@tanstack/react-query';
import { getToken } from '@/lib/auth';
import { type EntitlementTool, getEntitlements } from '@/services/entitlements';

export const ENTITLEMENTS_KEY = (courseSlug?: string) =>
	['entitlements', courseSlug ?? null] as const;

/**
 * Customer entitlements from upvox. Replaces the old per-course feature model
 * + the dead `/credits/*` reads. Helpers expose the common derivations the UI
 * needs (active plan? this tool's free quota / cost? vox balance? unlimited?).
 */
export function useEntitlements(
	courseSlug?: string,
	opts?: { enabled?: boolean },
) {
	const enabled =
		(opts?.enabled ?? true) &&
		typeof window !== 'undefined' &&
		(!!getToken('customer') || !!getToken('user'));

	const query = useQuery({
		queryKey: ENTITLEMENTS_KEY(courseSlug),
		queryFn: () => getEntitlements(courseSlug),
		staleTime: 30_000,
		enabled,
	});

	const ent = query.data;
	const status = ent?.subscription?.status;

	return {
		...query,
		entitlements: ent,
		isTestUnlimited: ent?.is_test_unlimited ?? false,
		hasActiveSubscription:
			!!ent?.subscription && (status === 'active' || status === 'trialing'),
		voxBalance: ent?.vox_balance ?? 0,
		tools: ent?.tools ?? [],
		courses: ent?.courses ?? [],
		toolFor: (key: string): EntitlementTool | undefined =>
			ent?.tools.find((t) => t.key === key),
		remainingFree: (key: string): number | null =>
			ent?.tools.find((t) => t.key === key)?.remaining_free ?? null,
	};
}
