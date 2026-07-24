'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	createImageSizePreset,
	deleteImageSizePreset,
	type ImageSizePreset,
	listImageSizePresets,
	updateImageSizePreset,
} from '../services/image-size-preset.service';

export const IMAGE_SIZE_PRESETS_KEY = ['image-size-presets'] as const;

export function useImageSizePresets() {
	return useQuery<ImageSizePreset[]>({
		queryKey: IMAGE_SIZE_PRESETS_KEY,
		queryFn: listImageSizePresets,
		staleTime: 60_000,
	});
}

function useInvalidatePresets() {
	const qc = useQueryClient();
	return () => qc.invalidateQueries({ queryKey: IMAGE_SIZE_PRESETS_KEY });
}

export function useCreateImageSizePreset() {
	const invalidate = useInvalidatePresets();
	return useMutation({
		mutationFn: createImageSizePreset,
		onSuccess: invalidate,
	});
}

export function useUpdateImageSizePreset() {
	const invalidate = useInvalidatePresets();
	return useMutation({
		mutationFn: ({
			id,
			...input
		}: { id: string } & Partial<{
			name: string;
			width: number;
			height: number;
		}>) => updateImageSizePreset(id, input),
		onSuccess: invalidate,
	});
}

export function useDeleteImageSizePreset() {
	const invalidate = useInvalidatePresets();
	return useMutation({
		mutationFn: deleteImageSizePreset,
		onSuccess: invalidate,
	});
}
