import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	createPromoLink,
	getPromoLinkInfo,
	listPromoLinks,
	redeemPromoLink,
	togglePromoLinkStatus,
} from '@/services/promo-links';
import type {
	CreatePromoLinkPayload,
	RedeemPromoLinkPayload,
} from '@/types/promo-link';

export function useCreatePromoLink() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreatePromoLinkPayload) => createPromoLink(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['promo-links'] });
		},
	});
}

export function usePromoLinkInfo(token: string) {
	return useQuery({
		queryKey: ['promo-link', token],
		queryFn: () => getPromoLinkInfo(token),
		retry: false,
		enabled: !!token,
		staleTime: Number.POSITIVE_INFINITY,
	});
}

export function useRedeemPromoLink(token: string) {
	return useMutation({
		mutationFn: (payload: RedeemPromoLinkPayload) =>
			redeemPromoLink(token, payload),
	});
}

export function usePromoLinks() {
	const { data, isLoading, error } = useQuery({
		queryKey: ['promo-links'],
		queryFn: () => listPromoLinks(),
	});
	return { promoLinks: data ?? [], isLoading, error };
}

export function useTogglePromoLinkStatus() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			status,
		}: {
			id: string;
			status: 'active' | 'inactive';
		}) => togglePromoLinkStatus(id, status),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['promo-links'] });
		},
	});
}
