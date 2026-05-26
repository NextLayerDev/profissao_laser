'use client';

import { useMe } from '@/modules/me';

export function usePermissions() {
	const { data: me, isLoading } = useMe();
	const isAdminOrStaff = me?.role === 'admin' || me?.role === 'staff';

	return {
		canPrice: isAdminOrStaff,
		canAdmin: isAdminOrStaff,
		isLoading,
	};
}
