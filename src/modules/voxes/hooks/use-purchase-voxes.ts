'use client';

import { useMutation } from '@tanstack/react-query';
import { purchaseVoxes } from '../services/voxes.service';
import type { PurchaseVoxesPayload } from '../types/voxes';

export function usePurchaseVoxes() {
	return useMutation({
		mutationFn: (payload: PurchaseVoxesPayload) => purchaseVoxes(payload),
		onSuccess: ({ checkout_url }) => {
			if (typeof window !== 'undefined') {
				window.location.href = checkout_url;
			}
		},
	});
}
