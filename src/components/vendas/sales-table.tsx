'use client';

import {
	AlertCircle,
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	ExternalLink,
	Info,
} from 'lucide-react';
import type {
	ItemsPerPage,
	SortDirection,
	SortField,
} from '@/hooks/use-sales-filters';
import type { Sales } from '@/types/sales';
import { STATUS_LABELS } from '@/utils/constants/status-label';
import { formatCurrency } from '@/utils/format-currency';
import { formatDate } from '@/utils/formatDate';
import { isTestRecord } from '@/utils/test-record-detector';
import { toTitleCase } from '@/utils/title-case';

interface Props {
	sales: Sales[];
	canPrice: boolean;
	sortField: SortField;
	sortDirection: SortDirection;
	onSort: (field: SortField) => void;
	onRowClick: (sale: Sales) => void;
	priceVariationMap: Map<string, boolean>;
	currentPage: number;
	totalPages: number;
	totalItems: number;
	itemsPerPage: ItemsPerPage;
	paginationRange: (number | 'ellipsis')[];
	onPageChange: (page: number) => void;
	onItemsPerPageChange: (n: ItemsPerPage) => void;
	hasActiveFilters: boolean;
	clearAllFilters: () => void;
}

function SortIcon({
	field,
	active,
	direction,
}: {
	field: string;
	active: SortField;
	direction: SortDirection;
}) {
	if (active !== field)
		return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
	return direction === 'asc' ? (
		<ArrowUp className="w-3.5 h-3.5 text-violet-400" />
	) : (
		<ArrowDown className="w-3.5 h-3.5 text-violet-400" />
	);
}

export function SalesTable({
	sales,
	canPrice,
	sortField,
	sortDirection,
	onSort,
	onRowClick,
	priceVariationMap,
	currentPage,
	totalPages,
	totalItems,
	itemsPerPage,
	paginationRange,
	onPageChange,
	onItemsPerPageChange,
	hasActiveFilters,
	clearAllFilters,
}: Props) {
	const colCount = canPrice ? 7 : 5;
	const startItem = (currentPage - 1) * itemsPerPage + 1;
	const endItem = Math.min(currentPage * itemsPerPage, totalItems);

	return (
		<div>
			{/* Table */}
			<div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-transparent shadow-sm dark:shadow-none">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-gray-400 text-left">
								<th className="px-4 py-3 font-medium">
									<button
										type="button"
										onClick={() => onSort('customer')}
										className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
									>
										Usuário
										<SortIcon
											field="customer"
											active={sortField}
											direction={sortDirection}
										/>
									</button>
								</th>
								<th className="px-4 py-3 font-medium hidden md:table-cell">
									E-mail
								</th>
								<th className="px-4 py-3 font-medium hidden xl:table-cell">
									Telefone
								</th>
								<th className="px-4 py-3 font-medium hidden lg:table-cell">
									Produto
								</th>
								{canPrice && (
									<th className="px-4 py-3 font-medium">
										<button
											type="button"
											onClick={() => onSort('amount')}
											className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
										>
											Valor
											<SortIcon
												field="amount"
												active={sortField}
												direction={sortDirection}
											/>
										</button>
									</th>
								)}
								<th className="px-4 py-3 font-medium">
									<button
										type="button"
										onClick={() => onSort('status')}
										className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
									>
										Status
										<SortIcon
											field="status"
											active={sortField}
											direction={sortDirection}
										/>
									</button>
								</th>
								<th className="px-4 py-3 font-medium hidden sm:table-cell">
									<button
										type="button"
										onClick={() => onSort('date')}
										className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
									>
										Data
										<SortIcon
											field="date"
											active={sortField}
											direction={sortDirection}
										/>
									</button>
								</th>
								{canPrice && (
									<th className="px-4 py-3 font-medium hidden lg:table-cell">
										Recibo
									</th>
								)}
							</tr>
						</thead>
						<tbody>
							{sales.length === 0 && (
								<tr>
									<td
										colSpan={colCount}
										className="px-4 py-10 text-center text-slate-500 dark:text-gray-500"
									>
										<div className="flex flex-col items-center gap-2">
											<span>Nenhuma venda encontrada.</span>
											{hasActiveFilters && (
												<button
													type="button"
													onClick={clearAllFilters}
													className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
												>
													Limpar filtros
												</button>
											)}
										</div>
									</td>
								</tr>
							)}
							{sales.map((sale) => {
								const isUnknown =
									sale.customer.name === 'Unknown' ||
									!sale.customer.name.trim();
								const isTest = isTestRecord(sale);
								const hasPriceVariation =
									priceVariationMap.get(sale.id) ?? false;
								const statusInfo = STATUS_LABELS[sale.status] ?? {
									label: sale.status,
									color: 'bg-gray-500/10 text-gray-400',
								};

								return (
									<tr
										key={sale.id}
										onClick={() => onRowClick(sale)}
										className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
									>
										{/* Usuário */}
										<td className="px-4 py-3">
											<div className="flex items-center gap-2">
												{isUnknown ? (
													<span
														className="flex items-center gap-1 text-slate-400 dark:text-gray-500"
														title="Usuário não vinculado a uma conta cadastrada"
													>
														<AlertCircle className="w-3.5 h-3.5" />
														Sem cadastro
													</span>
												) : (
													<span className="font-medium text-slate-900 dark:text-white">
														{toTitleCase(sale.customer.name)}
													</span>
												)}
												{isTest && (
													<span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
														Teste
													</span>
												)}
											</div>
											{/* Mobile: show email below name */}
											<div className="md:hidden mt-0.5 space-y-0.5">
												<span
													className={`block text-xs ${isUnknown ? 'text-amber-500 font-medium' : 'text-slate-500 dark:text-gray-400'}`}
												>
													{sale.customer.email}
												</span>
												{sale.customer.phone && (
													<span className="block text-[10px] text-violet-400/80 font-medium">
														{sale.customer.phone}
													</span>
												)}
											</div>
										</td>

										{/* E-mail */}
										<td
											className={`px-4 py-3 hidden md:table-cell ${isUnknown ? 'text-amber-500 font-medium' : 'text-slate-600 dark:text-gray-400'}`}
										>
											{sale.customer.email}
										</td>

										{/* Telefone */}
										<td className="px-4 py-3 hidden xl:table-cell text-slate-600 dark:text-gray-400 tabular-nums">
											{sale.customer.phone || (
												<span className="text-slate-400 dark:text-gray-600 italic">
													Não informado
												</span>
											)}
										</td>

										{/* Produto */}
										<td className="px-4 py-3 hidden lg:table-cell">
											<span
												className="block max-w-[200px] truncate text-slate-900 dark:text-white"
												title={sale.product}
											>
												{sale.product}
											</span>
										</td>

										{/* Valor */}
										{canPrice && (
											<td className="px-4 py-3 tabular-nums">
												<span className="flex items-center gap-1">
													{formatCurrency(sale.amount, sale.currency ?? 'BRL')}
													{hasPriceVariation && (
														<span title="Preço diferente do padrão — possível cupom ou preço promocional">
															<Info className="w-3.5 h-3.5 text-blue-400" />
														</span>
													)}
												</span>
											</td>
										)}

										{/* Status */}
										<td className="px-4 py-3">
											<span
												className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
											>
												{statusInfo.label}
											</span>
										</td>

										{/* Data */}
										<td className="px-4 py-3 text-slate-600 dark:text-gray-400 tabular-nums hidden sm:table-cell">
											{formatDate(sale.date)}
										</td>

										{/* Recibo */}
										{canPrice && (
											<td className="px-4 py-3 hidden lg:table-cell">
												{sale.receipt_url ? (
													<a
														href={sale.receipt_url}
														target="_blank"
														rel="noopener noreferrer"
														onClick={(e) => e.stopPropagation()}
														className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
													>
														Ver
														<ExternalLink size={13} />
													</a>
												) : (
													<span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
														Não gerado
													</span>
												)}
											</td>
										)}
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>

			{/* Pagination */}
			{totalItems > 0 && (
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-1">
					{/* Items per page */}
					<div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
						<select
							value={itemsPerPage}
							onChange={(e) =>
								onItemsPerPageChange(Number(e.target.value) as ItemsPerPage)
							}
							className="appearance-none bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50 cursor-pointer"
						>
							<option value={10}>10</option>
							<option value={25}>25</option>
							<option value={50}>50</option>
							<option value={100}>100</option>
						</select>
						<span>por página</span>
					</div>

					{/* Counter */}
					<span className="text-sm text-slate-500 dark:text-gray-500">
						Exibindo {startItem}–{endItem} de {totalItems} vendas
					</span>

					{/* Page navigation */}
					<div className="flex items-center gap-1">
						<PaginationButton
							onClick={() => onPageChange(1)}
							disabled={currentPage === 1}
						>
							<ChevronsLeft className="w-4 h-4" />
						</PaginationButton>
						<PaginationButton
							onClick={() => onPageChange(currentPage - 1)}
							disabled={currentPage === 1}
						>
							<ChevronLeft className="w-4 h-4" />
						</PaginationButton>

						{paginationRange.map((item, idx) => {
							const key =
								item === 'ellipsis'
									? `ellipsis-${idx < 3 ? 'start' : 'end'}`
									: `page-${item}`;
							return item === 'ellipsis' ? (
								<span
									key={key}
									className="px-2 py-1 text-sm text-slate-400 dark:text-gray-500"
								>
									...
								</span>
							) : (
								<button
									key={key}
									type="button"
									onClick={() => onPageChange(item as number)}
									className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors ${
										item === currentPage
											? 'bg-violet-600 text-white'
											: 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-[#252528]'
									}`}
								>
									{item}
								</button>
							);
						})}

						<PaginationButton
							onClick={() => onPageChange(currentPage + 1)}
							disabled={currentPage === totalPages}
						>
							<ChevronRight className="w-4 h-4" />
						</PaginationButton>
						<PaginationButton
							onClick={() => onPageChange(totalPages)}
							disabled={currentPage === totalPages}
						>
							<ChevronsRight className="w-4 h-4" />
						</PaginationButton>
					</div>
				</div>
			)}
		</div>
	);
}

function PaginationButton({
	children,
	onClick,
	disabled,
}: {
	children: React.ReactNode;
	onClick: () => void;
	disabled: boolean;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className="p-1.5 rounded-lg text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-[#252528] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
		>
			{children}
		</button>
	);
}
