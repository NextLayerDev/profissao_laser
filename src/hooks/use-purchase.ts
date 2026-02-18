'use client';

import { useMutation } from '@tanstack/react-query';
import { createPurchase } from '@/services/purchase';
import type { PurchasePayload } from '@/types/purchase';

export function usePurchase() {
	return useMutation({
		mutationFn: (payload: PurchasePayload) => createPurchase(payload),
		onSuccess: ({ checkoutUrl }) => {
			window.location.href = checkoutUrl;
		},
	});
}
