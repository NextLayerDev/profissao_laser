import { useMutation, useQuery } from '@tanstack/react-query';
import {
	createPaymentLink,
	getPaymentLinkInfo,
	redeemPaymentLink,
} from '@/services/payment-links';
import type {
	CreatePaymentLinkPayload,
	RedeemPaymentLinkPayload,
} from '@/types/payment-link';

export function useCreatePaymentLink() {
	return useMutation({
		mutationFn: (payload: CreatePaymentLinkPayload) =>
			createPaymentLink(payload),
	});
}

export function usePaymentLinkInfo(token: string) {
	return useQuery({
		queryKey: ['payment-link', token],
		queryFn: () => getPaymentLinkInfo(token),
		retry: false,
		enabled: !!token,
		staleTime: Number.POSITIVE_INFINITY,
	});
}

export function useRedeemPaymentLink(token: string) {
	return useMutation({
		mutationFn: (payload: RedeemPaymentLinkPayload) =>
			redeemPaymentLink(token, payload),
	});
}
