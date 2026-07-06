'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	createCoupon,
	deleteCoupon,
	listCouponRedemptions,
	listCoupons,
	updateCoupon,
} from '@/services/upvox-coupons';
import type {
	CreateCouponPayload,
	UpdateCouponPayload,
} from '@/types/upvox-coupons';

const KEYS = {
	list: ['coupons'] as const,
	redemptions: (id: string) => ['coupon-redemptions', id] as const,
};

export function useCoupons() {
	return useQuery({ queryKey: KEYS.list, queryFn: listCoupons });
}

export function useCreateCoupon() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateCouponPayload) => createCoupon(payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list }),
	});
}

export function useUpdateCoupon() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: UpdateCouponPayload;
		}) => updateCoupon(id, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list }),
	});
}

export function useDeleteCoupon() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteCoupon(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list }),
	});
}

export function useCouponRedemptions(id: string | null) {
	return useQuery({
		queryKey: KEYS.redemptions(id ?? ''),
		queryFn: () => listCouponRedemptions(id as string),
		enabled: !!id,
	});
}
