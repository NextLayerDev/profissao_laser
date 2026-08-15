import {
	type PlanDetails,
	planDetailsSchema,
} from '@/modules/plans/types/plan-details';
import { apiCourses } from '@/shared/lib/api-courses';

/**
 * Pacote = plano vendido fora da régua da landing, por link próprio. O backend
 * devolve o mesmo shape de `GET /v1/plan/:id/details` (plan + tools + courses),
 * então reusamos `planDetailsSchema`.
 */
export async function getPublicPackages(): Promise<PlanDetails[]> {
	const { data } = await apiCourses.get('/v1/packages');
	return planDetailsSchema.array().parse(data);
}

export async function getPublicPackage(key: string): Promise<PlanDetails> {
	const { data } = await apiCourses.get(`/v1/package/${key}`);
	return planDetailsSchema.parse(data);
}
