import { api } from '@/shared/lib/fetch';
import {
	type CoursePlanRow,
	coursePlanRowSchema,
	type UpsertCoursePlanPayload,
} from '../types/course-plan';

export async function createCoursePlan(
	slug: string,
	planKey: string,
	payload: UpsertCoursePlanPayload,
): Promise<CoursePlanRow> {
	const { data } = await api.post(
		`/v1/course/${slug}/plan/${planKey}`,
		payload,
	);
	return coursePlanRowSchema.parse(data);
}

export async function updateCoursePlan(
	slug: string,
	planKey: string,
	payload: UpsertCoursePlanPayload,
): Promise<CoursePlanRow> {
	const { data } = await api.patch(
		`/v1/course/${slug}/plan/${planKey}`,
		payload,
	);
	return coursePlanRowSchema.parse(data);
}

export async function deleteCoursePlan(
	slug: string,
	planKey: string,
): Promise<void> {
	await api.delete(`/v1/course/${slug}/plan/${planKey}`);
}
