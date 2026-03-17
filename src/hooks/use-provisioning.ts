'use client';

import { useQuery } from '@tanstack/react-query';
import {
	getProvisioningBySession,
	getProvisioningStatus,
} from '@/services/provisioning';

export function useProvisioningJob(sessionId: string | null) {
	return useQuery({
		queryKey: ['provisioning-job', sessionId],
		queryFn: () => getProvisioningBySession(sessionId as string),
		enabled: !!sessionId,
		retry: 10,
		retryDelay: 3000,
		refetchInterval: (query) => {
			if (query.state.data) return false;
			return 3000;
		},
	});
}

export function useProvisioningStatus(jobId: string | null) {
	return useQuery({
		queryKey: ['provisioning-status', jobId],
		queryFn: () => getProvisioningStatus(jobId as string),
		enabled: !!jobId,
		staleTime: 0,
		refetchIntervalInBackground: true,
		refetchInterval: (query) => {
			const status = query.state.data?.status;
			if (status === 'completed' || status === 'failed') return false;
			return 3000;
		},
	});
}
