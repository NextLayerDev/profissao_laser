'use client';

import { useQuery } from '@tanstack/react-query';
import { useIsAdmin } from '@/modules/me';
import { getUser } from '@/services/users';
import { getCurrentUser } from '@/shared/lib/auth';
import { getRoleByPermissionId } from '@/utils/constants/roles';

export function usePermissions() {
	const currentUser = getCurrentUser();
	const hasUserToken = useIsAdmin();
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
