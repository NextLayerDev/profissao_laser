import { apiCourses as api } from '@/shared/lib/api-courses';
import {
	type PlanTool,
	planToolSchema,
	type SetPlanToolPayload,
} from '../types/plan-tools';

export async function listPlanTools(planId: string): Promise<PlanTool[]> {
	const { data } = await api.get(`/v1/plan/${planId}/tools`);
	return planToolSchema.array().parse(data);
}

export async function setPlanTool(
	planId: string,
	toolKey: string,
	payload: SetPlanToolPayload,
): Promise<PlanTool> {
	const { data } = await api.put(`/v1/plan/${planId}/tool/${toolKey}`, payload);
	return planToolSchema.parse(data);
}

export async function removePlanTool(
	planId: string,
	toolKey: string,
): Promise<void> {
	await api.delete(`/v1/plan/${planId}/tool/${toolKey}`);
}
