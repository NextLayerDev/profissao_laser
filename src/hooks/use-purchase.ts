'use client';

import { useMutation } from '@tanstack/react-query';
import { createPurchase } from '@/services/purchase';
import type { PurchasePayload } from '@/types/purchase';

export function usePurchase(isCourseOnly?: boolean) {
	return useMutation({
		mutationFn: (payload: PurchasePayload) => createPurchase(payload),
		onSuccess: ({ checkoutUrl }) => {
			if (isCourseOnly) {
				sessionStorage.setItem('purchase_type', 'course_only');
			}
			window.location.href = checkoutUrl;
		},
	});
}
