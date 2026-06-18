import { apiCourses } from '@/shared/lib/api-courses';
import { type Entitlements, entitlementsSchema } from '../types/entitlements';

/** Pass `courseSlug` to get exact `remaining_free` for that course. */
export async function getEntitlements(
	courseSlug?: string,
): Promise<Entitlements> {
	const { data } = await apiCourses.get('/v1/me/entitlements', {
		params: courseSlug ? { course_slug: courseSlug } : undefined,
	});
	return entitlementsSchema.parse(data);
}
