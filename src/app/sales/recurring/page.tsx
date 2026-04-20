'use client';

import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/dashboard/header';
import { RecurringTable } from '@/components/vendas/recurring-table';
import { usePermissions } from '@/hooks/use-permissions';
import { useRecurringSales } from '@/hooks/use-sales';
import type { RecurringSubscription } from '@/types/sales';

const ITEMS_PER_PAGE = 50;

type StatusFilter = 'active' | 'trialing' | 'all';

export default function RecurringSales() {
	const router = useRouter();
	const { canPrice, isLoading: permissionsLoading } = usePermissions();
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
	const [currentPage, setCurrentPage] = useState(1);

	const { subscriptions, isLoading, error } = useRecurringSales({
		status: statusFilter,
		limit: 100,
	});

	useEffect(() => {
		if (!permissionsLoading && !canPrice) {
			router.replace('/dashboard');
		}
	}, [canPrice, permissionsLoading, router]);

	const sorted = useMemo<RecurringSubscription[]>(
		() =>
			[...subscriptions].sort(
				(a, b) =>
					new Date(a.nextChargeAt).getTime() -
					new Date(b.nextChargeAt).getTime(),
			),
		[subscriptions],
	);

	const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
	const paginated = sorted.slice(
		(currentPage - 1) * ITEMS_PER_PAGE,
		currentPage * ITEMS_PER_PAGE,
	);

	function handleStatusChange(value: StatusFilter) {
		setStatusFilter(value);
		setCurrentPage(1);
	}

	if (!canPrice && !permissionsLoading) return null;

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] text-slate-900 dark:text-white font-sans">
			<Header />

			<main className="px-8 py-6 space-y-6">
				{/* Title + Filter */}
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
							Assinaturas recorrentes
						</h2>
						<p className="text-slate-600 dark:text-gray-400 mt-1">
							Cobranças periódicas ativas, ordenadas pela próxima cobrança.
						</p>
					</div>

					<div className="flex items-center gap-2">
						<label
							htmlFor="status-filter"
							className="text-sm text-slate-600 dark:text-gray-400 shrink-0"
						>
							Status:
						</label>
						<select
							id="status-filter"
							value={statusFilter}
							onChange={(e) =>
								handleStatusChange(e.target.value as StatusFilter)
							}
							className="appearance-none bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50 cursor-pointer"
						>
							<option value="all">Todos</option>
							<option value="active">Ativos</option>
							<option value="trialing">Trial</option>
						</select>
					</div>
				</div>

				{/* Loading */}
				{isLoading && (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
					</div>
				)}

				{/* Error */}
				{error && (
					<div className="flex items-center justify-center py-20 text-red-400">
						Erro ao carregar assinaturas recorrentes.
					</div>
				)}

				{/* Content */}
				{!isLoading && !error && (
					<RecurringTable
						subscriptions={paginated}
						currentPage={currentPage}
						totalPages={totalPages}
						totalItems={sorted.length}
						itemsPerPage={ITEMS_PER_PAGE}
						onPageChange={setCurrentPage}
					/>
				)}
			</main>
		</div>
	);
}
