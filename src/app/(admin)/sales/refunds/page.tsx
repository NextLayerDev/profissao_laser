'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/dashboard/header';
import { usePermissions } from '@/hooks/use-permissions';
import { RefundsSection } from '@/modules/analytics';

export default function RefundsPage() {
	const router = useRouter();
	const { can, isLoading: permissionsLoading } = usePermissions();
	const allowed = can('vendas.view');

	useEffect(() => {
		if (!permissionsLoading && !allowed) {
			router.replace('/dashboard');
		}
	}, [allowed, permissionsLoading, router]);

	if (!allowed && !permissionsLoading) return null;

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />

			<main className="px-4 md:px-8 py-6 space-y-6">
				<div>
					<Link
						href="/sales"
						className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white transition-colors mb-2"
					>
						<ArrowLeft className="w-3.5 h-3.5" />
						Voltar para Vendas
					</Link>
					<h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
						Reembolsos
					</h2>
					<p className="text-slate-600 dark:text-gray-400 mt-1">
						Reembolsos de assinaturas e compras de VOX.
					</p>
				</div>

				<RefundsSection />
			</main>
		</div>
	);
}
