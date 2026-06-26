'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/dashboard/header';
import { FornecedoresAdminView } from '@/components/fornecedores/fornecedores-admin-view';
import { usePermissions } from '@/modules/access';

export default function FornecedoresAdminPage() {
	const router = useRouter();
	const { can, isLoading } = usePermissions();
	const allowed = can('ferramentas.view');

	useEffect(() => {
		if (!isLoading && !allowed) {
			router.replace('/dashboard');
		}
	}, [allowed, isLoading, router]);

	if (isLoading || !allowed) {
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
				<FornecedoresAdminView />
			</main>
		</div>
	);
}
