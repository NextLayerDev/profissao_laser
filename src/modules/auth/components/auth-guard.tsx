'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMe } from '@/modules/me';
import { getCurrentUser } from '@/shared/lib/auth';

const PUBLIC_PATHS = [
	'/login',
	'/register',
	'/forgot-password',
	'/reset-password',
	'/store',
	'/',
	'/checkout',
	'/payment-link',
	'/promo-link',
	'/global-promo-link',
];

const ADMIN_PATHS = [
	'/dashboard',
	'/products',
	'/courses',
	'/planos',
	'/sales',
	'/links',
	'/reports',
	'/community',
	'/acessos',
	'/forum',
];

function isAdminPath(pathname: string): boolean {
	return ADMIN_PATHS.some((p) =>
		p === '/'
			? pathname === '/'
			: pathname === p || pathname.startsWith(`${p}/`),
	);
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const me = useMe();
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const isPublic = PUBLIC_PATHS.some((p) =>
			p === '/' ? pathname === '/' : pathname.startsWith(p),
		);

		if (isPublic) {
			setReady(true);
			return;
		}

		const jwt = getCurrentUser();
		if (!jwt) {
			router.replace('/login');
			return;
		}

		// Determina role: prefere /me, com fallback no JWT se /me falhar
		if (me.isLoading) return;

		const role = me.data?.role ?? jwt.role;
		const isAdmin = role === 'admin' || role === 'staff';

		if (!isAdmin && isAdminPath(pathname)) {
			router.replace('/store');
			return;
		}

		setReady(true);
	}, [pathname, router, me.isLoading, me.data]);

	if (!ready) return null;

	return <>{children}</>;
}
