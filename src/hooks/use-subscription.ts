'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
	createSubscription,
	downgradeSubscription,
	upgradeSubscription,
} from '@/services/subscription';
import type { CreateSubscriptionPayload } from '@/types/subscription';
import type { SubscriptionChangePayload } from '@/types/subscription-change';

export function useCreateSubscription() {
	return useMutation({
		mutationFn: (payload: CreateSubscriptionPayload) =>
			createSubscription(payload),
	});
}

export function useUpgradeSubscription() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: SubscriptionChangePayload) =>
			upgradeSubscription(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['customer-plans'] });
		},
	});
}

export function useDowngradeSubscription() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: SubscriptionChangePayload) =>
			downgradeSubscription(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['customer-plans'] });
		},
	});
}
