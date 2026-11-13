'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	changePlan,
	getBillingPortalUrl,
	previewPlanChange,
} from '@/modules/subscriptions/services/subscriptions.service';
import type { PlanChangePayload } from '@/modules/subscriptions/types/subscriptions';
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

/** Prévia da troca de plano: valor exato que sai do cartão (ou data da troca). */
export function usePlanChangePreview(
	subscriptionId: string | null,
	payload: PlanChangePayload | null,
) {
	return useQuery({
		queryKey: ['plan-change-preview', subscriptionId, payload],
		queryFn: () =>
			previewPlanChange(subscriptionId as string, payload as PlanChangePayload),
		enabled: !!subscriptionId && !!payload,
		// Sempre recalcula ao abrir: o crédito muda a cada dia de uso.
		staleTime: 0,
		gcTime: 0,
		retry: false,
	});
}

export function useChangePlan() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			subscriptionId,
			payload,
		}: {
			subscriptionId: string;
			payload: PlanChangePayload;
		}) => changePlan(subscriptionId, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['my-subscription'] });
			qc.invalidateQueries({ queryKey: ['entitlements'] });
			qc.invalidateQueries({ queryKey: ['customer-plans'] });
		},
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
