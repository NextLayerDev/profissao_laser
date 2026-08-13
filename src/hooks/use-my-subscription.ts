'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getBillingPortalUrl } from '@/modules/subscriptions/services/subscriptions.service';
import {
	cancelMySubscription,
	getMySubscription,
	refundMySubscription,
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
		staleTime: 90_000,
	});
}

export function useCancelMySubscription() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: cancelMySubscription,
		onSuccess: () => qc.invalidateQueries({ queryKey: ['my-subscription'] }),
	});
}

export function useRefundMySubscription() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: refundMySubscription,
		onSuccess: () => qc.invalidateQueries({ queryKey: ['my-subscription'] }),
	});
}

export function useBillingPortal() {
	return useMutation({
		mutationFn: getBillingPortalUrl,
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
