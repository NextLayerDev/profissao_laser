import { apiCourses } from '@/shared/lib/api-courses';
import { type VoxUseSummary, voxUseSummarySchema } from '@/types/vox-use';

/** Vox por Uso: concedidos, usados, a descontar e demonstrativo por pagamento. */
export async function getVoxUseSummary(params: {
	from?: string;
	to?: string;
}): Promise<VoxUseSummary> {
	const { data } = await apiCourses.get('/v1/admin/vox-use', { params });
	return voxUseSummarySchema.parse(data);
}
