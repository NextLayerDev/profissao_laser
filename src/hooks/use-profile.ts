'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	changeMyPassword,
	getMyProfile,
	updateMyProfile,
	uploadMyAvatar,
} from '@/services/profile';
import type {
	ChangePasswordPayload,
	MyProfile,
	UpdateProfilePayload,
} from '@/types/profile';

const PROFILE_KEY = ['my-profile'] as const;

export function useMyProfile(enabled = true) {
	return useQuery({
		queryKey: PROFILE_KEY,
		queryFn: getMyProfile,
		enabled,
		staleTime: 60_000,
		retry: 1,
	});
}

export function useUpdateMyProfile() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: UpdateProfilePayload) => updateMyProfile(payload),
		onSuccess: (data: MyProfile) => {
			qc.setQueryData(PROFILE_KEY, data);
		},
	});
}

export function useUploadMyAvatar() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (file: File) => uploadMyAvatar(file),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: PROFILE_KEY });
		},
	});
}

export function useChangeMyPassword() {
	return useMutation({
		mutationFn: (payload: ChangePasswordPayload) => changeMyPassword(payload),
	});
}
