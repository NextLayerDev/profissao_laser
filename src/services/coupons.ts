import { api } from '@/lib/fetch';
import type { Coupon, CreateCouponPayload } from '@/types/coupons';

export type { Coupon, CreateCouponPayload };

export async function createCoupon(
	payload: CreateCouponPayload,
): Promise<Coupon> {
	const { data } = await api.post('/coupon', payload);
	return data;
}

export async function getProductCoupons(productId: string): Promise<Coupon[]> {
	const { data } = await api.get(`/coupons/${productId}`, {
		params: { product_id: productId },
	});
	return data;
}

export async function deleteCoupon(couponId: string): Promise<void> {
	await api.delete(`/coupon/${couponId}`);
}
