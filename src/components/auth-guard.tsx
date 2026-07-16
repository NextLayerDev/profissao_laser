'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentUser, isAdmin } from '@/lib/auth';

const PUBLIC_PATHS = [
	'/login',
	'/register',
	'/store',
	'/',
	'/checkout',
	'/payment-link',
	'/promo-link',
	'/global-promo-link',
	'/link-plano',
];

const ADMIN_PATHS = [
	'/dashboard',
	'/products',
	'/sales',
	'/links',
	'/cupons',
	'/reports',
	'/community',
	'/acessos',
	'/forum',
	'/omniresposta',
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
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const isPublic = PUBLIC_PATHS.some((p) =>
			p === '/' ? pathname === '/' : pathname.startsWith(p),
		);

		if (!isPublic && !getCurrentUser()) {
			router.replace('/login');
			return;
		}

		if (!isPublic && getCurrentUser() && !isAdmin() && isAdminPath(pathname)) {
			router.replace('/store');
			return;
		}

		setReady(true);
	}, [pathname, router]);

	if (!ready) return null;

	return <>{children}</>;
}
