'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/dashboard/header';
import { ParametrosAdminView } from '@/components/parametros/parametros-admin-view';
import { usePermissions } from '@/hooks/use-permissions';

export default function ParametrosAdminPage() {
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
			<main className="px-4 md:px-8 py-6">
				<ParametrosAdminView />
			</main>
		</div>
	);
}
