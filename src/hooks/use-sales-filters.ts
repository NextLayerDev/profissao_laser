import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Sales } from '@/types/sales';
import { filterByDateRange, getSummaryKPIs } from '@/utils/sales-analytics';
import { isTestRecord } from '@/utils/test-record-detector';

export type PeriodPreset =
	| 'all'
	| 'today'
	| 'week'
	| 'month'
	| 'year'
	| 'custom';
export type SortField = 'customer' | 'amount' | 'date' | 'status' | null;
export type SortDirection = 'asc' | 'desc';
export type ItemsPerPage = 10 | 25 | 50 | 100;

const STATUS_ORDER: Record<string, number> = {
	paid: 0,
	pending: 1,
	refunded: 2,
	canceled: 3,
};

function getDateRangeForPreset(
	preset: PeriodPreset,
	customFrom: string,
	customTo: string,
): { from: Date; to: Date } | null {
	const now = new Date();
	const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const endOfDay = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
		23,
		59,
		59,
		999,
	);

	switch (preset) {
		case 'all':
			return null;
		case 'today':
			return { from: startOfDay, to: endOfDay };
		case 'week': {
			const day = now.getDay();
			const diff = day === 0 ? 6 : day - 1;
			const monday = new Date(startOfDay);
			monday.setDate(monday.getDate() - diff);
			return { from: monday, to: endOfDay };
		}
		case 'month':
			return {
				from: new Date(now.getFullYear(), now.getMonth(), 1),
				to: endOfDay,
			};
		case 'year':
			return { from: new Date(now.getFullYear(), 0, 1), to: endOfDay };
		case 'custom': {
			if (!customFrom || !customTo) return null;
			return {
				from: new Date(`${customFrom}T00:00:00`),
				to: new Date(`${customTo}T23:59:59.999`),
			};
		}
		default:
			return null;
	}
}

function computePaginationRange(
	currentPage: number,
	totalPages: number,
): (number | 'ellipsis')[] {
	if (totalPages <= 7) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}

	const range: (number | 'ellipsis')[] = [1];

	if (currentPage > 3) {
		range.push('ellipsis');
	}

	const start = Math.max(2, currentPage - 1);
	const end = Math.min(totalPages - 1, currentPage + 1);

	for (let i = start; i <= end; i++) {
		range.push(i);
	}

	if (currentPage < totalPages - 2) {
		range.push('ellipsis');
	}

	range.push(totalPages);

	return range;
}

function computePriceVariations(sales: Sales[]): Map<string, boolean> {
	const productPrices: Record<string, Record<number, number>> = {};
	for (const sale of sales) {
		if (!productPrices[sale.product]) {
			productPrices[sale.product] = {};
		}
		productPrices[sale.product][sale.amount] =
			(productPrices[sale.product][sale.amount] ?? 0) + 1;
	}

	const productModes: Record<string, number> = {};
	for (const [product, prices] of Object.entries(productPrices)) {
		let modePrice = 0;
		let modeCount = 0;
		for (const [price, count] of Object.entries(prices)) {
			if (count > modeCount) {
				modeCount = count;
				modePrice = Number(price);
			}
		}
		productModes[product] = modePrice;
	}

	const variations = new Map<string, boolean>();
	for (const sale of sales) {
		variations.set(sale.id, sale.amount !== productModes[sale.product]);
	}
	return variations;
}

export function useSalesFilters(sales: Sales[]) {
	const [searchQuery, setSearchQuery] = useState('');
	const [debouncedQuery, setDebouncedQuery] = useState('');
	const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('all');
	const [customFrom, setCustomFrom] = useState('');
	const [customTo, setCustomTo] = useState('');
	const [selectedProduct, setSelectedProduct] = useState('');
	const [selectedStatus, setSelectedStatus] = useState('');
	const [hideTestRecords, setHideTestRecords] = useState(true);
	const [sortField, setSortFieldState] = useState<SortField>('date');
	const [sortDirection, setSortDirectionState] =
		useState<SortDirection>('desc');
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPageState] = useState<ItemsPerPage>(25);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	const resetPage = useCallback(() => setCurrentPage(1), []);

	const handleSetSearchQuery = useCallback(
		(v: string) => {
			setSearchQuery(v);
			resetPage();
		},
		[resetPage],
	);
	const handleSetPeriodPreset = useCallback(
		(v: PeriodPreset) => {
			setPeriodPreset(v);
			resetPage();
		},
		[resetPage],
	);
	const handleSetCustomFrom = useCallback(
		(v: string) => {
			setCustomFrom(v);
			resetPage();
		},
		[resetPage],
	);
	const handleSetCustomTo = useCallback(
		(v: string) => {
			setCustomTo(v);
			resetPage();
		},
		[resetPage],
	);
	const handleSetSelectedProduct = useCallback(
		(v: string) => {
			setSelectedProduct(v);
			resetPage();
		},
		[resetPage],
	);
	const handleSetSelectedStatus = useCallback(
		(v: string) => {
			setSelectedStatus(v);
			resetPage();
		},
		[resetPage],
	);
	const handleSetHideTestRecords = useCallback(
		(v: boolean) => {
			setHideTestRecords(v);
			resetPage();
		},
		[resetPage],
	);

	const handleSetItemsPerPage = useCallback(
		(v: ItemsPerPage) => {
			setItemsPerPageState(v);
			resetPage();
		},
		[resetPage],
	);

	const handleToggleSort = useCallback(
		(field: SortField) => {
			setSortFieldState((prev) => {
				if (prev === field) {
					setSortDirectionState((dir) => {
						if (dir === 'asc') return 'desc';
						setSortFieldState(null);
						return 'asc';
					});
					return field;
				}
				setSortDirectionState('asc');
				return field;
			});
			resetPage();
		},
		[resetPage],
	);

	const clearAllFilters = useCallback(() => {
		setSearchQuery('');
		setDebouncedQuery('');
		setPeriodPreset('all');
		setCustomFrom('');
		setCustomTo('');
		setSelectedProduct('');
		setSelectedStatus('');
		setHideTestRecords(true);
		setSortFieldState('date');
		setSortDirectionState('desc');
		setCurrentPage(1);
	}, []);

	const uniqueProducts = useMemo(() => {
		const set = new Set(sales.map((s) => s.product));
		return Array.from(set).sort();
	}, [sales]);

	const uniqueStatuses = useMemo(() => {
		const set = new Set(sales.map((s) => s.status));
		return Array.from(set);
	}, [sales]);

	const filteredSales = useMemo(() => {
		let result = sales;

		if (hideTestRecords) {
			result = result.filter((s) => !isTestRecord(s));
		}

		if (debouncedQuery) {
			const q = debouncedQuery.toLowerCase();
			result = result.filter(
				(s) =>
					s.customer.name.toLowerCase().includes(q) ||
					s.customer.email.toLowerCase().includes(q),
			);
		}

		const dateRange = getDateRangeForPreset(periodPreset, customFrom, customTo);
		if (dateRange) {
			result = filterByDateRange(result, dateRange.from, dateRange.to);
		}

		if (selectedProduct) {
			result = result.filter((s) => s.product === selectedProduct);
		}

		if (selectedStatus) {
			result = result.filter((s) => s.status === selectedStatus);
		}

		return result;
	}, [
		sales,
		hideTestRecords,
		debouncedQuery,
		periodPreset,
		customFrom,
		customTo,
		selectedProduct,
		selectedStatus,
	]);

	const sortedSales = useMemo(() => {
		if (!sortField) return filteredSales;

		return [...filteredSales].sort((a, b) => {
			let cmp = 0;
			switch (sortField) {
				case 'customer':
					cmp = a.customer.name.localeCompare(b.customer.name, 'pt-BR');
					break;
				case 'amount':
					cmp = a.amount - b.amount;
					break;
				case 'date':
					cmp = a.date.localeCompare(b.date);
					break;
				case 'status':
					cmp = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
					break;
			}
			return sortDirection === 'asc' ? cmp : -cmp;
		});
	}, [filteredSales, sortField, sortDirection]);

	const totalPages = Math.max(1, Math.ceil(sortedSales.length / itemsPerPage));
	const safePage = Math.min(currentPage, totalPages);

	const paginatedSales = useMemo(() => {
		const start = (safePage - 1) * itemsPerPage;
		return sortedSales.slice(start, start + itemsPerPage);
	}, [sortedSales, safePage, itemsPerPage]);

	const paginationRange = useMemo(
		() => computePaginationRange(safePage, totalPages),
		[safePage, totalPages],
	);

	const kpiData = useMemo(() => {
		const base = getSummaryKPIs(filteredSales);
		const uniqueCustomers = new Set(filteredSales.map((s) => s.customer.email))
			.size;
		return { ...base, uniqueCustomers };
	}, [filteredSales]);

	const priceVariationMap = useMemo(
		() => computePriceVariations(sales),
		[sales],
	);

	const hasActiveFilters =
		searchQuery !== '' ||
		periodPreset !== 'all' ||
		selectedProduct !== '' ||
		selectedStatus !== '' ||
		!hideTestRecords;

	return {
		searchQuery,
		setSearchQuery: handleSetSearchQuery,
		periodPreset,
		setPeriodPreset: handleSetPeriodPreset,
		customFrom,
		setCustomFrom: handleSetCustomFrom,
		customTo,
		setCustomTo: handleSetCustomTo,
		selectedProduct,
		setSelectedProduct: handleSetSelectedProduct,
		selectedStatus,
		setSelectedStatus: handleSetSelectedStatus,
		hideTestRecords,
		setHideTestRecords: handleSetHideTestRecords,
		sortField,
		sortDirection,
		toggleSort: handleToggleSort,
		currentPage: safePage,
		setCurrentPage,
		totalPages,
		itemsPerPage,
		setItemsPerPage: handleSetItemsPerPage,
		filteredSales,
		sortedSales,
		paginatedSales,
		paginationRange,
		uniqueProducts,
		uniqueStatuses,
		kpiData,
		priceVariationMap,
		hasActiveFilters,
		clearAllFilters,
	};
}
