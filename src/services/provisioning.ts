import { internalApi } from '@/lib/internal-api';
import {
	type ProvisioningJob,
	type ProvisioningStatus,
	provisioningJobSchema,
	provisioningStatusSchema,
} from '@/types/provisioning';

export async function getProvisioningBySession(
	sessionId: string,
): Promise<ProvisioningJob> {
	const { data } = await internalApi.get(
		`/internal/provisioning/by-session/${sessionId}`,
	);
	return provisioningJobSchema.parse(data);
}

export async function getProvisioningStatus(
	jobId: string,
): Promise<ProvisioningStatus> {
	const { data } = await internalApi.get(
		`/internal/provisioning/${jobId}/status`,
	);
	return provisioningStatusSchema.parse(data);
}
