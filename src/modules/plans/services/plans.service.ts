import { apiCourses as api } from '@/shared/lib/api-courses';
import {
	type CreatePlanPayload,
	type Plan,
	planSchema,
	type UpdatePlanPayload,
} from '../types/plans';

export async function listPlans(): Promise<Plan[]> {
	const { data } = await api.get('/v1/plans');
	return planSchema.array().parse(data);
}

export async function createPlan(payload: CreatePlanPayload): Promise<Plan> {
	const { data } = await api.post('/v1/plan', payload);
	return planSchema.parse(data);
}

export async function updatePlan(
	id: string,
	payload: UpdatePlanPayload,
): Promise<Plan> {
	const { data } = await api.patch(`/v1/plan/${id}`, payload);
	return planSchema.parse(data);
}

export async function deletePlan(id: string): Promise<void> {
	await api.delete(`/v1/plan/${id}`);
}
