'use client';

import {
	ArrowUpDown,
	Filter,
	FlaskConical,
	KeyRound,
	Loader2,
	Search,
	ShieldCheck,
	ShieldOff,
	Trash2,
	UserCheck,
	Users,
	Wifi,
	XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { StatCard } from '@/components/ui/stat-card';
import { VoxxysIcon } from '@/components/ui/voxxys-icon';
import {
	usePayingMembersCount,
	usePresenceSummary,
} from '@/hooks/use-presence';
import {
	usePlanOptions,
	useSetStudentTestUnlimited,
	useStudents,
} from '@/hooks/use-students';
import type { Student } from '@/services/students';
import { BlockCustomerModal } from './block-customer-modal';
import { CancelSubscriptionModal } from './cancel-subscription-modal';
import { ChangePasswordModal } from './change-password-modal';
import { ChangePlanModal } from './change-plan-modal';
import { DeleteCustomerModal } from './delete-customer-modal';
import { STATUS_LABELS, statusColor, statusLabel } from './status-maps';

/* ------------------------------------------------------------------ */
/*  Status filter options                                              */
/* ------------------------------------------------------------------ */

/** Status options offered in the filter (subset that admins care about). */
const STATUS_FILTER_OPTIONS = [
	'active',
	'trialing',
	'past_due',
	'canceled',
	'paused',
	'unpaid',
];

const ACTIVE_STATUSES = new Set(['active', 'trialing']);

const selectCls =
	'px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500';

const limit = 20;

function formatPeriodDate(dateStr: string | null): string | null {
	if (!dateStr) return null;
	return new Date(dateStr).toLocaleDateString('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
}

/* ------------------------------------------------------------------ */
/*  Main view                                                          */
/* ------------------------------------------------------------------ */

export function AlunosAdminView() {
	const [page, setPage] = useState(1);
	const [searchInput, setSearchInput] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState('');
	const [planFilter, setPlanFilter] = useState('');

	/* modal targets */
	const [planTarget, setPlanTarget] = useState<Student | null>(null);
	const [cancelTarget, setCancelTarget] = useState<Student | null>(null);
	const [blockTarget, setBlockTarget] = useState<Student | null>(null);
	const [passwordTarget, setPasswordTarget] = useState<Student | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

	const { flat: planOptions } = usePlanOptions();
	const setTestUnlimited = useSetStudentTestUnlimited();
	const { data: payingCount } = usePayingMembersCount();
	const { data: presence } = usePresenceSummary();

	/* debounce the search box → drives `q`; reset to page 1 on change */
	useEffect(() => {
		const t = setTimeout(() => {
			setDebouncedSearch(searchInput.trim());
			setPage(1);
		}, 350);
		return () => clearTimeout(t);
	}, [searchInput]);

	const queryParams = useMemo(
		() => ({
			page,
			limit,
			...(debouncedSearch && { q: debouncedSearch }),
			...(statusFilter && { status: statusFilter }),
			...(planFilter && { plan_id: planFilter }),
		}),
		[page, debouncedSearch, statusFilter, planFilter],
	);

	const { data, isLoading, isFetching, error } = useStudents(queryParams);
	const students = data?.items ?? [];
	const total = data?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / limit));

	/* stats — total is server-truth; the rest are counts of the loaded page */
	const pageActive = students.filter(
		(s) => s.subscription_status && ACTIVE_STATUSES.has(s.subscription_status),
	).length;
	const pageBlocked = students.filter((s) => s.blocked).length;
	const pageTestUnlimited = students.filter((s) => s.is_test_unlimited).length;

	const hasFilters = !!debouncedSearch || !!statusFilter || !!planFilter;

	function clearFilters() {
		setSearchInput('');
		setDebouncedSearch('');
		setStatusFilter('');
		setPlanFilter('');
		setPage(1);
	}

	const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
	const showingTo = Math.min(page * limit, total);

	return (
		<>
			{/* Header */}
			<div className="flex items-center justify-between mb-6 flex-wrap gap-3">
				<div>
					<h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
						<Users className="w-6 h-6 text-violet-500" />
						Gerenciar Alunos
					</h2>
					<p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
						Altere planos, gerencie assinaturas, bloqueios e senhas dos alunos.
					</p>
				</div>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
				<StatCard
					value={total.toLocaleString('pt-BR')}
					label="Total de alunos"
					icon={Users}
					color="bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
				/>
				<StatCard
					value={
						payingCount != null ? payingCount.toLocaleString('pt-BR') : '—'
					}
					label="Pagantes (ativos + trial)"
					icon={UserCheck}
					color="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
				/>
				<StatCard
					value={presence ? presence.onlineNow.toLocaleString('pt-BR') : '—'}
					label="Online agora"
					icon={Wifi}
					color="bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400"
				/>
				<StatCard
					value={pageActive}
					label="Ativos (nesta página)"
					icon={UserCheck}
					color="bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400"
				/>
				<StatCard
					value={pageBlocked}
					label="Bloqueados (nesta página)"
					icon={ShieldOff}
					color="bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
				/>
				<StatCard
					value={pageTestUnlimited}
					label="Teste ilimitado (nesta página)"
					icon={FlaskConical}
					color="bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
				/>
			</div>

			{/* Filter bar */}
			<div className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
				<Filter className="w-4 h-4 text-slate-400" aria-hidden="true" />

				<div>
					<label htmlFor="alunos-status-filter" className="sr-only">
						Filtrar por status
					</label>
					<select
						id="alunos-status-filter"
						className={selectCls}
						value={statusFilter}
						onChange={(e) => {
							setStatusFilter(e.target.value);
							setPage(1);
						}}
					>
						<option value="">Todos os status</option>
						{STATUS_FILTER_OPTIONS.map((s) => (
							<option key={s} value={s}>
								{STATUS_LABELS[s] ?? s}
							</option>
						))}
					</select>
				</div>

				<div>
					<label htmlFor="alunos-plan-filter" className="sr-only">
						Filtrar por plano
					</label>
					<select
						id="alunos-plan-filter"
						className={selectCls}
						value={planFilter}
						onChange={(e) => {
							setPlanFilter(e.target.value);
							setPage(1);
						}}
					>
						<option value="">Todos os planos</option>
						{planOptions.map((p) => (
							<option key={p.id} value={p.id}>
								{p.name}
							</option>
						))}
					</select>
				</div>

				<div className="ml-auto flex items-center gap-2">
					{hasFilters && (
						<button
							type="button"
							onClick={clearFilters}
							className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
						>
							Limpar
						</button>
					)}
					<div className="relative">
						<Search
							className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
							aria-hidden="true"
						/>
						<label htmlFor="alunos-search" className="sr-only">
							Buscar por nome ou e-mail
						</label>
						<input
							id="alunos-search"
							type="search"
							placeholder="Buscar por nome ou e-mail..."
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							className="pl-9 pr-4 py-2 w-56 md:w-72 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"
						/>
					</div>
				</div>
			</div>

			{/* List */}
			{isLoading ? (
				<div className="flex justify-center py-20">
					<Loader2 className="w-8 h-8 animate-spin text-violet-500" />
				</div>
			) : error ? (
				<div className="flex justify-center py-20 text-red-500">
					Erro ao carregar alunos.
				</div>
			) : students.length === 0 ? (
				<EmptyState
					icon={Users}
					title="Nenhum aluno encontrado"
					description={
						hasFilters
							? 'Ajuste a busca ou os filtros para ver mais resultados.'
							: 'Ainda não há alunos cadastrados.'
					}
				/>
			) : (
				<div
					className={`rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-transparent shadow-sm dark:shadow-none transition-opacity ${
						isFetching ? 'opacity-60' : ''
					}`}
				>
					{/* Desktop table */}
					<table className="hidden md:table w-full text-sm">
						<thead>
							<tr className="bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-gray-400 text-left">
								<th className="px-4 py-3 font-medium">Aluno</th>
								<th className="px-4 py-3 font-medium">Telefone</th>
								<th className="px-4 py-3 font-medium">Plano / Assinatura</th>
								<th className="px-4 py-3 font-medium">Voxxys</th>
								<th className="px-4 py-3 font-medium">Status</th>
								<th className="px-4 py-3 font-medium text-right">Ações</th>
							</tr>
						</thead>
						<tbody>
							{students.map((s) => (
								<tr
									key={s.id}
									className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
								>
									<td className="px-4 py-3">
										<Link
											href={`/alunos/${s.id}`}
											aria-label={`Ver detalhes de ${s.name ?? s.email}`}
											className="font-medium text-slate-900 dark:text-white rounded-sm hover:text-violet-600 dark:hover:text-violet-400 hover:underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 transition-colors"
										>
											{s.name ?? 'Sem nome'}
										</Link>
										<p className="text-xs text-slate-500 dark:text-gray-500">
											{s.email}
										</p>
									</td>
									<td className="px-4 py-3 text-slate-600 dark:text-gray-400">
										{s.phone ?? '—'}
									</td>
									<td className="px-4 py-3">
										<PlanCell student={s} />
									</td>
									<td className="px-4 py-3">
										<span className="inline-flex items-center gap-1 font-mono text-sm font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
											<VoxxysIcon className="w-3.5 h-3.5" />
											{s.voxes_balance.toLocaleString('pt-BR')}
										</span>
									</td>
									<td className="px-4 py-3">
										<BlockedBadge blocked={s.blocked} />
									</td>
									<td className="px-4 py-3">
										<RowActions
											student={s}
											onPlan={() => setPlanTarget(s)}
											onCancel={() => setCancelTarget(s)}
											onBlock={() => setBlockTarget(s)}
											onPassword={() => setPasswordTarget(s)}
											onDelete={() => setDeleteTarget(s)}
											onToggleTest={() =>
												setTestUnlimited.mutate({
													id: s.id,
													isTestUnlimited: !s.is_test_unlimited,
												})
											}
										/>
									</td>
								</tr>
							))}
						</tbody>
					</table>

					{/* Mobile cards */}
					<div className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
						{students.map((s) => (
							<div key={s.id} className="p-4 space-y-3">
								<div className="flex items-start justify-between gap-2">
									<div className="min-w-0">
										<Link
											href={`/alunos/${s.id}`}
											aria-label={`Ver detalhes de ${s.name ?? s.email}`}
											className="block font-medium text-slate-900 dark:text-white truncate rounded-sm hover:text-violet-600 dark:hover:text-violet-400 hover:underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 transition-colors"
										>
											{s.name ?? 'Sem nome'}
										</Link>
										<p className="text-xs text-slate-500 dark:text-gray-500 truncate">
											{s.email}
										</p>
									</div>
									<BlockedBadge blocked={s.blocked} />
								</div>
								<div className="flex items-center justify-between gap-2">
									<PlanCell student={s} />
									<span className="inline-flex items-center gap-1 font-mono text-sm font-semibold text-amber-600 dark:text-amber-400 tabular-nums shrink-0">
										<VoxxysIcon className="w-3.5 h-3.5" />
										{s.voxes_balance.toLocaleString('pt-BR')}
									</span>
								</div>
								<RowActions
									student={s}
									onPlan={() => setPlanTarget(s)}
									onCancel={() => setCancelTarget(s)}
									onBlock={() => setBlockTarget(s)}
									onPassword={() => setPasswordTarget(s)}
									onDelete={() => setDeleteTarget(s)}
									onToggleTest={() =>
										setTestUnlimited.mutate({
											id: s.id,
											isTestUnlimited: !s.is_test_unlimited,
										})
									}
								/>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Pagination */}
			{!isLoading && !error && students.length > 0 && (
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4">
					<p className="text-sm text-slate-500 dark:text-slate-400">
						Mostrando{' '}
						<span className="font-semibold text-slate-700 dark:text-slate-300">
							{showingFrom} a {showingTo}
						</span>{' '}
						de{' '}
						<span className="font-semibold text-slate-700 dark:text-slate-300">
							{total.toLocaleString('pt-BR')}
						</span>
					</p>

					{totalPages > 1 && (
						<nav className="flex items-center gap-1" aria-label="Paginação">
							<button
								type="button"
								disabled={page === 1}
								onClick={() => setPage((p) => p - 1)}
								className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-violet-400 transition-colors"
							>
								Anterior
							</button>

							{Array.from({ length: totalPages }, (_, i) => i + 1)
								.filter((p) => {
									if (totalPages <= 7) return true;
									if (p === 1 || p === totalPages) return true;
									return Math.abs(p - page) <= 1;
								})
								.map((p, idx, arr) => {
									const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
									return (
										<span key={p} className="flex items-center">
											{showEllipsis && (
												<span className="px-1 text-slate-400">...</span>
											)}
											<button
												type="button"
												onClick={() => setPage(p)}
												aria-current={p === page ? 'page' : undefined}
												aria-label={`Página ${p}`}
												className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
													p === page
														? 'bg-violet-600 text-white'
														: 'text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-500/10'
												}`}
											>
												{p}
											</button>
										</span>
									);
								})}

							<button
								type="button"
								disabled={page === totalPages}
								onClick={() => setPage((p) => p + 1)}
								className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-violet-400 transition-colors"
							>
								Próximo
							</button>
						</nav>
					)}
				</div>
			)}

			{/* Modals */}
			<ChangePlanModal
				student={planTarget}
				onClose={() => setPlanTarget(null)}
			/>
			<CancelSubscriptionModal
				student={cancelTarget}
				onClose={() => setCancelTarget(null)}
			/>
			<BlockCustomerModal
				student={blockTarget}
				onClose={() => setBlockTarget(null)}
			/>
			<ChangePasswordModal
				student={passwordTarget}
				onClose={() => setPasswordTarget(null)}
			/>
			<DeleteCustomerModal
				student={deleteTarget}
				onClose={() => setDeleteTarget(null)}
			/>
		</>
	);
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function BlockedBadge({ blocked }: { blocked: boolean }) {
	if (blocked) {
		return (
			<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400">
				<ShieldOff className="w-3 h-3" aria-hidden="true" />
				Bloqueado
			</span>
		);
	}
	return (
		<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400">
			<ShieldCheck className="w-3 h-3" aria-hidden="true" />
			Ativo
		</span>
	);
}

function PlanCell({ student }: { student: Student }) {
	const status = student.subscription_status;
	const colorClass = statusColor(status);
	const renewal = formatPeriodDate(student.current_period_end);

	return (
		<div className="flex flex-col gap-1">
			<span className="text-sm font-medium text-slate-900 dark:text-white">
				{student.plan?.name ?? 'Sem plano'}
			</span>
			<div className="flex items-center gap-2 flex-wrap">
				<span
					className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit ${colorClass}`}
				>
					{statusLabel(status)}
				</span>
				{renewal && (
					<span className="text-xs text-slate-500 dark:text-gray-500">
						Renova {renewal}
					</span>
				)}
			</div>
		</div>
	);
}

function RowActions({
	student,
	onPlan,
	onCancel,
	onBlock,
	onPassword,
	onDelete,
	onToggleTest,
}: {
	student: Student;
	onPlan: () => void;
	onCancel: () => void;
	onBlock: () => void;
	onPassword: () => void;
	onDelete: () => void;
	onToggleTest: () => void;
}) {
	const iconBtn =
		'p-2 rounded-lg transition-colors text-slate-500 dark:text-gray-400';
	return (
		<div className="flex items-center md:justify-end gap-1">
			<button
				type="button"
				onClick={onPlan}
				aria-label={`Alterar plano de ${student.name ?? student.email}`}
				title="Alterar plano"
				className={`${iconBtn} hover:text-violet-500 hover:bg-violet-500/10`}
			>
				<ArrowUpDown className="w-4 h-4" />
			</button>
			<button
				type="button"
				onClick={onCancel}
				aria-label={`Cancelar assinatura de ${student.name ?? student.email}`}
				title="Cancelar assinatura"
				className={`${iconBtn} hover:text-red-500 hover:bg-red-500/10`}
			>
				<XCircle className="w-4 h-4" />
			</button>
			<button
				type="button"
				onClick={onBlock}
				aria-label={`${student.blocked ? 'Desbloquear' : 'Bloquear'} ${student.name ?? student.email}`}
				title={student.blocked ? 'Desbloquear' : 'Bloquear'}
				className={`${iconBtn} hover:text-amber-500 hover:bg-amber-500/10`}
			>
				<ShieldOff className="w-4 h-4" />
			</button>
			<button
				type="button"
				onClick={onToggleTest}
				aria-label={
					student.is_test_unlimited
						? `Remover conta teste ilimitada de ${student.name ?? student.email}`
						: `Tornar ${student.name ?? student.email} conta teste ilimitada`
				}
				aria-pressed={student.is_test_unlimited}
				title={
					student.is_test_unlimited
						? 'Remover conta teste (ilimitado)'
						: 'Tornar conta teste (tudo desbloqueado)'
				}
				className={`p-2 rounded-lg transition-colors ${
					student.is_test_unlimited
						? 'text-emerald-500 bg-emerald-500/10'
						: 'text-slate-500 dark:text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10'
				}`}
			>
				<FlaskConical className="w-4 h-4" />
			</button>
			<button
				type="button"
				onClick={onPassword}
				aria-label={`Alterar senha de ${student.name ?? student.email}`}
				title="Alterar senha"
				className={`${iconBtn} hover:text-violet-500 hover:bg-violet-500/10`}
			>
				<KeyRound className="w-4 h-4" />
			</button>
			<button
				type="button"
				onClick={onDelete}
				aria-label={`Excluir ${student.name ?? student.email}`}
				title="Excluir aluno"
				className={`${iconBtn} hover:text-red-500 hover:bg-red-500/10`}
			>
				<Trash2 className="w-4 h-4" />
			</button>
		</div>
	);
}
