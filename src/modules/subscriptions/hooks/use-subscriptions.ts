'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import {
	cancelSubscription,
	createSubscription,
	downgradeSubscription,
	listMySubscriptions,
	upgradeSubscription,
} from '../services/subscriptions.service';
import type {
	ChangeSubscriptionPayload,
	CreateSubscriptionPayload,
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
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao iniciar assinatura')),
	});
}

export function useUpgradeSubscription() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: ChangeSubscriptionPayload;
		}) => upgradeSubscription(id, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: mySubscriptionsQueryKey });
			toast.success('Plano atualizado!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao fazer upgrade')),
	});
}

export function useDowngradeSubscription() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: ChangeSubscriptionPayload;
		}) => downgradeSubscription(id, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: mySubscriptionsQueryKey });
			toast.success('Plano atualizado!');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao fazer downgrade')),
	});
}

export function useCancelSubscription() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => cancelSubscription(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: mySubscriptionsQueryKey });
			toast.success('Assinatura cancelada.');
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Erro ao cancelar assinatura')),
	});
}
