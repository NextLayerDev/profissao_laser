'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/dashboard/header';
import { ToolBuilderView } from '@/components/ferramentas/tool-builder-view';
import { usePermissions } from '@/hooks/use-permissions';

export default function FerramentasBuilderPage() {
	const router = useRouter();
	const { can, isLoading } = usePermissions();
	const allowed = can('tools.build');

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
				<ToolBuilderView />
			</main>
		</div>
	);
}
