import { apiCourses } from '@/shared/lib/api-courses';
import {
	type Coupon,
	type CouponListItem,
	type CouponRedemption,
	type CreateCouponPayload,
	couponListItemSchema,
	couponRedemptionSchema,
	couponSchema,
	type UpdateCouponPayload,
	type ValidateCouponPayload,
	type ValidateCouponResult,
	validateCouponResultSchema,
} from '@/types/upvox-coupons';

/** Lista os cupons com estatísticas (staff/admin). */
export async function listCoupons(): Promise<CouponListItem[]> {
	const { data } = await apiCourses.get('/v1/coupons');
	return couponListItemSchema.array().parse(data);
}

export async function createCoupon(
	payload: CreateCouponPayload,
): Promise<Coupon> {
	const { data } = await apiCourses.post('/v1/coupons', payload);
	return couponSchema.parse(data);
}

export async function updateCoupon(
	id: string,
	payload: UpdateCouponPayload,
): Promise<Coupon> {
	const { data } = await apiCourses.patch(`/v1/coupons/${id}`, payload);
	return couponSchema.parse(data);
}

export async function deleteCoupon(id: string): Promise<void> {
	await apiCourses.delete(`/v1/coupons/${id}`);
}

export async function listCouponRedemptions(
	id: string,
): Promise<CouponRedemption[]> {
	const { data } = await apiCourses.get(`/v1/coupons/${id}/redemptions`);
	return couponRedemptionSchema.array().parse(data);
}

/** Prévia do desconto no checkout (cliente logado). */
export async function validateCoupon(
	payload: ValidateCouponPayload,
): Promise<ValidateCouponResult> {
	const { data } = await apiCourses.post('/v1/coupons/validate', payload);
	return validateCouponResultSchema.parse(data);
}
