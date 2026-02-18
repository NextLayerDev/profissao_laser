'use client';

import { useMutation } from '@tanstack/react-query';
import { createSubscription } from '@/services/subscription';
import type { CreateSubscriptionPayload } from '@/types/subscription';

export function useCreateSubscription() {
	return useMutation({
		mutationFn: (payload: CreateSubscriptionPayload) =>
			createSubscription(payload),
	});
}
