'use client';

import { Download, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '@/components/dashboard/header';
import { SaleDetailModal } from '@/components/vendas/sale-detail-modal';
import { SalesFilters } from '@/components/vendas/sales-filters';
import { SalesKpiCards } from '@/components/vendas/sales-kpi-cards';
import { SalesTable } from '@/components/vendas/sales-table';
import { usePermissions } from '@/hooks/use-permissions';
import { useSales } from '@/hooks/use-sales';
import { useSalesFilters } from '@/hooks/use-sales-filters';
import type { Sales } from '@/types/sales';
import { exportSalesCSV } from '@/utils/export-sales-csv';

export default function Vendas() {
	const router = useRouter();
	const { sales, isLoading, error } = useSales();
	const { canPrice, isLoading: permissionsLoading } = usePermissions();
	const [selectedSale, setSelectedSale] = useState<Sales | null>(null);

	const filters = useSalesFilters(sales ?? []);

	useEffect(() => {
		if (!permissionsLoading && !canPrice) {
			router.replace('/dashboard');
		}
	}, [canPrice, permissionsLoading, router]);

	if (!canPrice && !permissionsLoading) {
		return null;
	}

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] text-slate-900 dark:text-white font-sans">
			<Header />

			<main className="px-8 py-6 space-y-6">
				{/* Title + Export */}
				<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
					<div>
						<h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
							Vendas
						</h2>
						<p className="text-slate-600 dark:text-gray-400 mt-1">
							Lista de todos os usuários que realizaram compras e o que
							adquiriram.
						</p>
					</div>
					{!isLoading && !error && (
						<button
							type="button"
							onClick={() => exportSalesCSV(filters.sortedSales)}
							disabled={filters.sortedSales.length === 0}
							className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
						>
							<Download className="w-4 h-4" />
							Exportar CSV
						</button>
					)}
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
						Erro ao carregar vendas.
					</div>
				)}

				{/* Content */}
				{!isLoading && !error && (
					<>
						{/* KPI Cards */}
						<SalesKpiCards kpiData={filters.kpiData} isLoading={false} />

						{/* Filters */}
						<SalesFilters
							searchQuery={filters.searchQuery}
							setSearchQuery={filters.setSearchQuery}
							periodPreset={filters.periodPreset}
							setPeriodPreset={filters.setPeriodPreset}
							customFrom={filters.customFrom}
							setCustomFrom={filters.setCustomFrom}
							customTo={filters.customTo}
							setCustomTo={filters.setCustomTo}
							selectedProduct={filters.selectedProduct}
							setSelectedProduct={filters.setSelectedProduct}
							selectedStatus={filters.selectedStatus}
							setSelectedStatus={filters.setSelectedStatus}
							hideTestRecords={filters.hideTestRecords}
							setHideTestRecords={filters.setHideTestRecords}
							uniqueProducts={filters.uniqueProducts}
							uniqueStatuses={filters.uniqueStatuses}
							hasActiveFilters={filters.hasActiveFilters}
							clearAllFilters={filters.clearAllFilters}
						/>

						{/* Table */}
						<SalesTable
							sales={filters.paginatedSales}
							canPrice={canPrice}
							sortField={filters.sortField}
							sortDirection={filters.sortDirection}
							onSort={filters.toggleSort}
							onRowClick={setSelectedSale}
							priceVariationMap={filters.priceVariationMap}
							currentPage={filters.currentPage}
							totalPages={filters.totalPages}
							totalItems={filters.sortedSales.length}
							itemsPerPage={filters.itemsPerPage}
							paginationRange={filters.paginationRange}
							onPageChange={filters.setCurrentPage}
							onItemsPerPageChange={filters.setItemsPerPage}
							hasActiveFilters={filters.hasActiveFilters}
							clearAllFilters={filters.clearAllFilters}
						/>
					</>
				)}

				{/* Detail Modal */}
				<SaleDetailModal
					sale={selectedSale}
					isOpen={!!selectedSale}
					onClose={() => setSelectedSale(null)}
					canPrice={canPrice}
				/>
			</main>
		</div>
	);
}
