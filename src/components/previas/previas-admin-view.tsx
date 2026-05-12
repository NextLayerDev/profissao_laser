'use client';

import {
	ChevronLeft,
	ChevronRight,
	Eye,
	Loader2,
	Search,
	Users,
	Zap,
} from 'lucide-react';
import { useState } from 'react';
import { usePreviasAdminUsage } from '@/hooks/use-previas';

function StatCard({
	icon: Icon,
	label,
	value,
	color,
}: {
	icon: typeof Eye;
	label: string;
	value: number | string;
	color: string;
}) {
	return (
		<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800/50 rounded-xl p-5">
			<div className="flex items-center gap-3 mb-2">
				<div
					className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}
				>
					<Icon className="w-5 h-5 text-white" />
				</div>
				<span className="text-sm text-slate-500 dark:text-slate-400">
					{label}
				</span>
			</div>
			<p className="text-2xl font-bold text-slate-900 dark:text-white">
				{value}
			</p>
		</div>
	);
}

function PlanBadge({ plan }: { plan: string }) {
	const lower = plan.toLowerCase();
	let classes =
		'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
	if (lower.includes('ouro') || lower.includes('gold')) {
		classes =
			'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
	} else if (lower.includes('platina') || lower.includes('platinum')) {
		classes =
			'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400';
	} else if (lower.includes('prata') || lower.includes('silver')) {
		classes =
			'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
	}
	return (
		<span
			className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes}`}
		>
			{plan}
		</span>
	);
}

function ProgressMini({ used, limit }: { used: number; limit: number }) {
	const pct = limit > 0 ? (used / limit) * 100 : 0;
	let barColor = 'bg-rose-500';
	if (pct >= 100) barColor = 'bg-red-600';
	else if (pct >= 75) barColor = 'bg-amber-500';

	return (
		<div className="flex items-center gap-2">
			<div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
				<div
					className={`h-full rounded-full ${barColor}`}
					style={{ width: `${Math.min(pct, 100)}%` }}
				/>
			</div>
			<span className="text-xs text-slate-500 dark:text-slate-400">
				{used}/{limit}
			</span>
		</div>
	);
}

export function PreviasAdminView() {
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [searchInput, setSearchInput] = useState('');
	const limit = 20;

	const { data, isLoading, error } = usePreviasAdminUsage(page, limit, search);

	const totalPages = data ? Math.ceil(data.total / limit) : 1;

	function handleSearch(e: React.FormEvent) {
		e.preventDefault();
		setSearch(searchInput.trim());
		setPage(1);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
				<Eye className="w-10 h-10 mb-3 opacity-40" />
				<p className="text-lg font-medium">Endpoint nao disponivel</p>
				<p className="text-sm mt-1">
					O endpoint de uso admin ainda nao esta ativo no backend.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Stat cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<StatCard
					icon={Zap}
					label="Previas Geradas Hoje"
					value={data?.summary.totalGeneratedToday ?? '-'}
					color="bg-rose-500"
				/>
				<StatCard
					icon={Users}
					label="Utilizadores Ativos Hoje"
					value={data?.summary.activeUsersToday ?? '-'}
					color="bg-violet-500"
				/>
				<StatCard
					icon={Users}
					label="Total Utilizadores"
					value={data?.summary.totalUsers ?? '-'}
					color="bg-slate-500"
				/>
			</div>

			{/* Search */}
			<form onSubmit={handleSearch} className="flex gap-2 max-w-md">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
					<input
						type="text"
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						placeholder="Pesquisar por nome ou email..."
						className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
					/>
				</div>
				<button
					type="submit"
					className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors"
				>
					Pesquisar
				</button>
			</form>

			{/* Table */}
			{isLoading ? (
				<div className="flex justify-center py-20">
					<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
				</div>
			) : (
				<div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-transparent shadow-sm dark:shadow-none">
					<table className="w-full text-sm">
						<thead>
							<tr className="bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-gray-400 text-left">
								<th className="px-4 py-3 font-medium">Nome</th>
								<th className="px-4 py-3 font-medium">Email</th>
								<th className="px-4 py-3 font-medium">Plano</th>
								<th className="px-4 py-3 font-medium">Usado/Limite</th>
								<th className="px-4 py-3 font-medium">Restante</th>
								<th className="px-4 py-3 font-medium">Ultima Geracao</th>
							</tr>
						</thead>
						<tbody>
							{(!data?.data || data.data.length === 0) && (
								<tr>
									<td
										colSpan={6}
										className="px-4 py-10 text-center text-slate-500 dark:text-gray-500"
									>
										Nenhum utilizador encontrado.
									</td>
								</tr>
							)}
							{data?.data.map((user) => (
								<tr
									key={user.customerId}
									className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/2 transition-colors"
								>
									<td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
										{user.customerName}
									</td>
									<td className="px-4 py-3 text-slate-600 dark:text-gray-400">
										{user.customerEmail}
									</td>
									<td className="px-4 py-3">
										<PlanBadge plan={user.plan} />
									</td>
									<td className="px-4 py-3">
										<ProgressMini used={user.used} limit={user.limit} />
									</td>
									<td className="px-4 py-3 text-slate-900 dark:text-white font-medium">
										{user.remaining}
									</td>
									<td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
										{user.lastGeneratedAt
											? new Date(user.lastGeneratedAt).toLocaleString('pt-PT', {
													day: '2-digit',
													month: '2-digit',
													hour: '2-digit',
													minute: '2-digit',
												})
											: '—'}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex items-center justify-center gap-3">
					<button
						type="button"
						disabled={page <= 1}
						onClick={() => setPage((p) => p - 1)}
						className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
					>
						<ChevronLeft className="w-4 h-4" />
					</button>
					<span className="text-sm text-slate-500 dark:text-slate-400">
						{page} / {totalPages}
					</span>
					<button
						type="button"
						disabled={page >= totalPages}
						onClick={() => setPage((p) => p + 1)}
						className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
					>
						<ChevronRight className="w-4 h-4" />
					</button>
				</div>
			)}
		</div>
	);
}
