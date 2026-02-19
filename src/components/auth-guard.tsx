'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/register', '/store'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

		if (!isPublic && !getCurrentUser()) {
			router.replace('/login');
			return;
		}

		setReady(true);
	}, [pathname, router]);

	if (!ready) return null;

	return <>{children}</>;
}
