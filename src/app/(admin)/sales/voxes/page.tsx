'use client';

import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Header } from '@/components/dashboard/header';
import { usePermissions } from '@/modules/access';
import { useVoxSales, VoxSalesTable } from '@/modules/voxes';

const LIMIT = 50;

export default function VoxSalesPage() {
	const router = useRouter();
	const { can, isLoading: permissionsLoading } = usePermissions();
	const allowed = can('vendas.view');

	const [offset, setOffset] = useState(0);

	const {
		data: sales = [],
		isLoading,
		isFetching,
		error,
	} = useVoxSales({ limit: LIMIT, offset });

	useEffect(() => {
		if (!permissionsLoading && !allowed) {
			router.replace('/dashboard');
		}
	}, [allowed, permissionsLoading, router]);

	const handleLoadMore = useCallback(() => {
		setOffset((prev) => prev + LIMIT);
	}, []);

	const handleLoadPrev = useCallback(() => {
		setOffset((prev) => Math.max(0, prev - LIMIT));
	}, []);

	if (!allowed && !permissionsLoading) return null;

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />

			<main className="px-4 md:px-8 py-6 space-y-6">
				<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
					<div>
						<Link
							href="/sales"
							className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white transition-colors mb-2"
						>
							<ArrowLeft className="w-3.5 h-3.5" />
							Voltar para Vendas
						</Link>
						<h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
							Vendas de Voxxys
						</h2>
						<p className="text-slate-600 dark:text-gray-400 mt-1">
							Compras de pacotes de voxxys, ordenadas do mais recente.
						</p>
					</div>
				</div>

				{isLoading && (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
					</div>
				)}

				{error && (
					<div className="flex items-center justify-center py-20 text-red-400">
						Erro ao carregar vendas de voxxys.
					</div>
				)}

				{!isLoading && !error && (
					<VoxSalesTable
						sales={sales}
						hasMore={sales.length === LIMIT}
						hasPrev={offset > 0}
						onLoadMore={handleLoadMore}
						onLoadPrev={handleLoadPrev}
						isLoading={isFetching}
					/>
				)}
			</main>
		</div>
	);
}
