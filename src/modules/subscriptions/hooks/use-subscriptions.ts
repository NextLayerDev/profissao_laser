'use client';

/**
 * Camada de assinaturas (write nas rotas reais do backend: `/subscription`,
 * `/subscription/upgrade`, `/subscription/downgrade`; read/cancel via `/v1/...`).
 * Casa única — o sistema legado `@/hooks/use-subscription` + `@/services/subscription`
 * foi aposentado e consolidado aqui.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	cancelSubscription,
	createSubscription,
	downgradeSubscription,
	listMySubscriptions,
	upgradeSubscription,
} from '../services/subscriptions.service';
import type {
	CreateSubscriptionPayload,
	SubscriptionChangePayload,
} from '../types/subscriptions';

export const mySubscriptionsQueryKey = ['me', 'subscriptions'] as const;

export function useMySubscriptions() {
	return useQuery({
		queryKey: mySubscriptionsQueryKey,
		queryFn: listMySubscriptions,
	});
}

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
			qc.invalidateQueries({ queryKey: ['my-subscription'] });
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
			qc.invalidateQueries({ queryKey: ['my-subscription'] });
		},
	});
}

export function useCancelSubscription() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => cancelSubscription(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: mySubscriptionsQueryKey });
			qc.invalidateQueries({ queryKey: ['my-subscription'] });
		},
	});
}
