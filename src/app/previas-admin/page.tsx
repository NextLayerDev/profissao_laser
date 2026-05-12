'use client';

import { Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/dashboard/header';
import { PreviasAdminView } from '@/components/previas/previas-admin-view';
import { usePermissions } from '@/hooks/use-permissions';

export default function PreviasAdminPage() {
	const router = useRouter();
	const { canAdmin, isLoading: permissionsLoading } = usePermissions();

	useEffect(() => {
		if (!permissionsLoading && !canAdmin) {
			router.replace('/dashboard');
		}
	}, [canAdmin, permissionsLoading, router]);

	if (permissionsLoading || !canAdmin) {
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
				<div className="mb-6">
					<h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
						<Eye className="w-6 h-6 text-violet-400" />
						Previas IA - Uso
					</h2>
					<p className="text-slate-600 dark:text-gray-400 mt-1">
						Monitorize o uso de previas IA por todos os utilizadores.
					</p>
				</div>

				<PreviasAdminView />
			</main>
		</div>
	);
}
