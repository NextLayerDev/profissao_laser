'use client';

import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Header } from '@/components/dashboard/header';
import { RefundsTable } from '@/components/vendas/refunds-table';
import { usePermissions } from '@/hooks/use-permissions';
import { useRefunds } from '@/hooks/use-sales';

const LIMIT = 50;

export default function RefundsPage() {
	const router = useRouter();
	const { canPrice, isLoading: permissionsLoading } = usePermissions();

	const [cursorStack, setCursorStack] = useState<string[]>([]);
	const [startingAfter, setStartingAfter] = useState<string | undefined>(
		undefined,
	);

	const { refunds, isLoading, isFetching, error } = useRefunds({
		limit: LIMIT,
		starting_after: startingAfter,
	});

	useEffect(() => {
		if (!permissionsLoading && !canPrice) {
			router.replace('/dashboard');
		}
	}, [canPrice, permissionsLoading, router]);

	const handleLoadMore = useCallback(() => {
		if (refunds.length === 0) return;
		const lastId = refunds[refunds.length - 1].id;
		setCursorStack((prev) => [...prev, startingAfter ?? '']);
		setStartingAfter(lastId);
	}, [refunds, startingAfter]);

	const handleLoadPrev = useCallback(() => {
		setCursorStack((prev) => {
			const next = [...prev];
			const prevCursor = next.pop();
			setStartingAfter(prevCursor === '' ? undefined : prevCursor);
			return next;
		});
	}, []);

	if (!canPrice && !permissionsLoading) return null;

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] text-slate-900 dark:text-white font-sans">
			<Header />

			<main className="px-8 py-6 space-y-6">
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
							Reembolsos
						</h2>
						<p className="text-slate-600 dark:text-gray-400 mt-1">
							Todos os reembolsos processados, ordenados do mais recente.
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
						Erro ao carregar reembolsos.
					</div>
				)}

				{!isLoading && !error && (
					<RefundsTable
						refunds={refunds}
						hasMore={refunds.length === LIMIT}
						hasPrev={cursorStack.length > 0}
						onLoadMore={handleLoadMore}
						onLoadPrev={handleLoadPrev}
						isLoading={isFetching}
					/>
				)}
			</main>
		</div>
	);
}
