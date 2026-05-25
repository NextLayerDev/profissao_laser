import { api } from '@/shared/lib/fetch';
import { type PlanDetails, planDetailsSchema } from '../types/plan-details';

export async function getPlanDetails(id: string): Promise<PlanDetails> {
	const { data } = await api.get(`/v1/plan/${id}/details`);
	return planDetailsSchema.parse(data);
}
