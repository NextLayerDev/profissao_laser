'use client';

import { useCustomerPlans } from '@/hooks/use-customer-plans';
import { getCurrentUser } from '@/lib/auth';
import {
	type OwnershipStatus,
	type ProductVariantRef,
	resolveOwnership,
} from '@/utils/ownership';

export function useOwnership(
	variants: ProductVariantRef[],
	selectedIndex: number,
): { status: OwnershipStatus; isLoading: boolean } {
	const user = getCurrentUser();
	const { data, isFetching, isError } = useCustomerPlans(user?.email ?? null);

	if (!user?.email) return { status: 'none', isLoading: false };
	if (isError) return { status: 'none', isLoading: false };
	if (!data) return { status: 'none', isLoading: isFetching };

	return {
		status: resolveOwnership(data, variants, selectedIndex),
		isLoading: false,
	};
}
