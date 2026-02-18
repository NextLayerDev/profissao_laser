'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	type CreateCouponPayload,
	createCoupon,
	deleteCoupon,
	getProductCoupons,
} from '@/services/coupons';

export function useProductCoupons(productId: string) {
	return useQuery({
		queryKey: ['coupons', productId],
		queryFn: () => getProductCoupons(productId),
		enabled: !!productId,
	});
}

export function useCreateCoupon(productId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateCouponPayload) => createCoupon(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['coupons', productId] });
		},
	});
}

export function useDeleteCoupon(productId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (couponId: string) => deleteCoupon(couponId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['coupons', productId] });
		},
	});
}
