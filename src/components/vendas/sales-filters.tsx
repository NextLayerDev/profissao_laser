'use client';

import { Search, X } from 'lucide-react';
import type { PeriodPreset } from '@/hooks/use-sales-filters';
import { STATUS_LABELS } from '@/utils/constants/status-label';

interface Props {
	searchQuery: string;
	setSearchQuery: (v: string) => void;
	periodPreset: PeriodPreset;
	setPeriodPreset: (v: PeriodPreset) => void;
	customFrom: string;
	setCustomFrom: (v: string) => void;
	customTo: string;
	setCustomTo: (v: string) => void;
	selectedProduct: string;
	setSelectedProduct: (v: string) => void;
	selectedStatus: string;
	setSelectedStatus: (v: string) => void;
	hideTestRecords: boolean;
	setHideTestRecords: (v: boolean) => void;
	uniqueProducts: string[];
	uniqueStatuses: string[];
	hasActiveFilters: boolean;
	clearAllFilters: () => void;
}

const PERIOD_OPTIONS: { value: PeriodPreset; label: string }[] = [
	{ value: 'all', label: 'Todos os períodos' },
	{ value: 'today', label: 'Hoje' },
	{ value: 'week', label: 'Esta semana' },
	{ value: 'month', label: 'Este mês' },
	{ value: 'year', label: 'Este ano' },
	{ value: 'custom', label: 'Personalizado' },
];

const selectClass =
	'appearance-none bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50 transition-colors cursor-pointer';

export function SalesFilters({
	searchQuery,
	setSearchQuery,
	periodPreset,
	setPeriodPreset,
	customFrom,
	setCustomFrom,
	customTo,
	setCustomTo,
	selectedProduct,
	setSelectedProduct,
	selectedStatus,
	setSelectedStatus,
	hideTestRecords,
	setHideTestRecords,
	uniqueProducts,
	hasActiveFilters,
	clearAllFilters,
}: Props) {
	return (
		<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl p-4 border border-slate-200 dark:border-gray-800/50 shadow-sm dark:shadow-none">
			<div className="flex flex-wrap items-center gap-3">
				{/* Search */}
				<div className="relative flex-1 min-w-[220px]">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
					<input
						type="text"
						placeholder="Buscar por nome ou e-mail..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
					/>
				</div>

				{/* Period */}
				<select
					value={periodPreset}
					onChange={(e) => setPeriodPreset(e.target.value as PeriodPreset)}
					className={selectClass}
				>
					{PERIOD_OPTIONS.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>

				{/* Custom date range */}
				{periodPreset === 'custom' && (
					<>
						<input
							type="date"
							value={customFrom}
							onChange={(e) => setCustomFrom(e.target.value)}
							className={`${selectClass} w-[150px]`}
						/>
						<span className="text-slate-400 dark:text-gray-500 text-sm">
							até
						</span>
						<input
							type="date"
							value={customTo}
							onChange={(e) => setCustomTo(e.target.value)}
							className={`${selectClass} w-[150px]`}
						/>
					</>
				)}

				{/* Product */}
				<select
					value={selectedProduct}
					onChange={(e) => setSelectedProduct(e.target.value)}
					className={`${selectClass} max-w-[220px]`}
				>
					<option value="">Todos os produtos</option>
					{uniqueProducts.map((p) => (
						<option key={p} value={p}>
							{p}
						</option>
					))}
				</select>

				{/* Status */}
				<select
					value={selectedStatus}
					onChange={(e) => setSelectedStatus(e.target.value)}
					className={selectClass}
				>
					<option value="">Todos os status</option>
					{Object.entries(STATUS_LABELS).map(([key, { label }]) => (
						<option key={key} value={key}>
							{label}
						</option>
					))}
				</select>

				{/* Test records toggle */}
				<label className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400 cursor-pointer select-none whitespace-nowrap">
					<input
						type="checkbox"
						checked={hideTestRecords}
						onChange={(e) => setHideTestRecords(e.target.checked)}
						className="w-4 h-4 rounded border-slate-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500 accent-violet-600"
					/>
					Ocultar testes
				</label>

				{/* Clear filters */}
				{hasActiveFilters && (
					<button
						type="button"
						onClick={clearAllFilters}
						className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
					>
						<X className="w-4 h-4" />
						Limpar filtros
					</button>
				)}
			</div>
		</div>
	);
}
