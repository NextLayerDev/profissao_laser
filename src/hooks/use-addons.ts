'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	attachAddon,
	createAddon,
	listMyAddons,
	removeAddon,
} from '@/services/addons';
import type { CreateAddonPayload } from '@/types/addons';

export function useCreateAddon() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateAddonPayload) => createAddon(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['products'] });
		},
	});
}

export function useMyAddons() {
	return useQuery({
		queryKey: ['my-addons'],
		queryFn: listMyAddons,
	});
}

export function useAttachAddon() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (productId: string) => attachAddon(productId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['my-addons'] });
			qc.invalidateQueries({ queryKey: ['my-subscription'] });
		},
	});
}

export function useRemoveAddon() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (itemId: string) => removeAddon(itemId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['my-addons'] });
			qc.invalidateQueries({ queryKey: ['my-subscription'] });
		},
	});
}
