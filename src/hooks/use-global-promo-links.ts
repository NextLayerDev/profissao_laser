import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	createGlobalPromoLink,
	getGlobalPromoLinkInfo,
	listGlobalPromoLinks,
	redeemGlobalPromoLink,
	toggleGlobalPromoLinkStatus,
} from '@/services/global-promo-links';
import type {
	CreateGlobalPromoLinkPayload,
	RedeemGlobalPromoLinkPayload,
} from '@/types/global-promo-link';

export function useCreateGlobalPromoLink() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateGlobalPromoLinkPayload) =>
			createGlobalPromoLink(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['global-promo-links'] });
		},
	});
}

export function useGlobalPromoLinkInfo(token: string) {
	return useQuery({
		queryKey: ['global-promo-link', token],
		queryFn: () => getGlobalPromoLinkInfo(token),
		retry: false,
		enabled: !!token,
		staleTime: Number.POSITIVE_INFINITY,
	});
}

export function useRedeemGlobalPromoLink(token: string) {
	return useMutation({
		mutationFn: (payload: RedeemGlobalPromoLinkPayload) =>
			redeemGlobalPromoLink(token, payload),
	});
}

export function useGlobalPromoLinks() {
	const { data, isLoading, error } = useQuery({
		queryKey: ['global-promo-links'],
		queryFn: () => listGlobalPromoLinks(),
	});
	return { globalPromoLinks: data ?? [], isLoading, error };
}

export function useToggleGlobalPromoLinkStatus() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			status,
		}: {
			id: string;
			status: 'active' | 'inactive';
		}) => toggleGlobalPromoLinkStatus(id, status),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['global-promo-links'] });
		},
	});
}
