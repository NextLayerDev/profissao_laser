'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/dashboard/header';
import { SuporteAdminView } from '@/components/suporte/suporte-admin-view';
import { usePermissions } from '@/hooks/use-permissions';

export default function SuportePage() {
	const router = useRouter();
	const { canAdmin, isLoading } = usePermissions();

	useEffect(() => {
		if (!isLoading && !canAdmin) {
			router.replace('/dashboard');
		}
	}, [canAdmin, isLoading, router]);

	if (isLoading || !canAdmin) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-slate-600 dark:text-gray-400">A carregar...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />
			<SuporteAdminView />
		</div>
	);
}
