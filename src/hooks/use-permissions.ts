'use client';

import { useMe } from '@/modules/me';

export function usePermissions() {
	const { data: me, isLoading } = useMe();
	const role = me?.role ?? null;

	const isAdminOrStaff = role === 'admin' || role === 'staff';

	return {
		canPrice: isAdminOrStaff,
		canAdmin: role === 'admin',
		isLoading,
	};
}
