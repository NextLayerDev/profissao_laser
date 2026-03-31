'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	cancelMySubscription,
	getMySubscription,
} from '@/services/my-subscription';
import {
	downgradeSubscription,
	upgradeSubscription,
} from '@/services/subscription';
import type { SubscriptionChangePayload } from '@/types/subscription-change';

export function useMySubscription() {
	return useQuery({
		queryKey: ['my-subscription'],
		queryFn: getMySubscription,
	});
}

export function useCancelMySubscription() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: cancelMySubscription,
		onSuccess: () => qc.invalidateQueries({ queryKey: ['my-subscription'] }),
	});
}

export function useUpgradeMySubscription() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: SubscriptionChangePayload) =>
			upgradeSubscription(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['my-subscription'] });
			qc.invalidateQueries({ queryKey: ['customer-plans'] });
		},
	});
}

export function useDowngradeMySubscription() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: SubscriptionChangePayload) =>
			downgradeSubscription(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['my-subscription'] });
			qc.invalidateQueries({ queryKey: ['customer-plans'] });
		},
	});
}
