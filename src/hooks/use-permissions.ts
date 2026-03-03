'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentUser, getToken } from '@/lib/auth';
import { getUser } from '@/services/users';
import { getRoleByPermissionId } from '@/utils/constants/roles';

export function usePermissions() {
	const currentUser = getCurrentUser();
	const hasUserToken = !!getToken('user');
	const userId = currentUser?.sub ?? null;

	const { data: user, isLoading } = useQuery({
		queryKey: ['user', userId],
		queryFn: () => {
			if (!userId) throw new Error('User ID required');
			return getUser(userId);
		},
		enabled: !!userId && hasUserToken,
	});

	const roleConfig = getRoleByPermissionId(user?.Permissions ?? null);

	return {
		canPrice: roleConfig?.canPrice ?? false,
		canAdmin: roleConfig?.canAdmin ?? false,
		isLoading: hasUserToken && !!userId && isLoading,
	};
}
