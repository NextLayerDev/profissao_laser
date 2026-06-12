'use client';

import {
	Check,
	ChevronLeft,
	ChevronRight,
	Loader2,
	MessageCircle,
	UserMinus,
	UserPlus,
	Users,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { StatCard } from '@/components/ui/stat-card';
import {
	useSetWaGroup,
	useWaGroup,
	WA_GROUP_PAGE_SIZE,
} from '@/hooks/use-wa-group';
import type { WaGroupRow } from '@/services/wa-group';

const STATUS_LABEL: Record<WaGroupRow['status'], string> = {
	active: 'Ativa',
	trialing: 'Trial',
	past_due: 'Inadimplente',
	canceled: 'Cancelada',
	paused: 'Pausada',
};

const STATUS_CLS: Record<WaGroupRow['status'], string> = {
	active:
		'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
	trialing:
		'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
	past_due:
		'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
	canceled: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
	paused: 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-gray-400',
};

function fmtDate(iso: string) {
	return new Date(iso).toLocaleDateString('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
}

function WaLink({ phone }: { phone: string | null }) {
	if (!phone)
		return <span className="text-xs text-slate-400">sem telefone</span>;
	return (
		<a
			href={`https://wa.me/${phone.replace(/\D/g, '')}`}
			target="_blank"
			rel="noopener noreferrer"
			className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
		>
			<MessageCircle className="w-3.5 h-3.5" />
			{phone}
		</a>
	);
}

function Row({ row }: { row: WaGroupRow }) {
	const setGroup = useSetWaGroup();

	const actionBtn =
		row.action === 'add' ? (
			<button
				type="button"
				disabled={setGroup.isPending}
				onClick={() =>
					setGroup.mutate(
						{ subscriptionId: row.subscription_id, added: true },
						{
							onSuccess: () =>
								toast.success('Marcado como adicionado ao grupo'),
							onError: () => toast.error('Erro ao marcar'),
						},
					)
				}
				className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50"
			>
				<UserPlus className="w-3.5 h-3.5" /> Marcar adicionado
			</button>
		) : row.action === 'remove' ? (
			<button
				type="button"
				disabled={setGroup.isPending}
				onClick={() =>
					setGroup.mutate(
						{ subscriptionId: row.subscription_id, added: false },
						{
							onSuccess: () => toast.success('Marcado como removido do grupo'),
							onError: () => toast.error('Erro ao marcar'),
						},
					)
				}
				className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
			>
				<UserMinus className="w-3.5 h-3.5" /> Marcar removido
			</button>
		) : row.wa_group_added ? (
			<span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
				<Check className="w-3.5 h-3.5" /> No grupo
			</span>
		) : (
			<span className="text-xs text-slate-400 dark:text-gray-500">
				Fora do grupo
			</span>
		);

	return (
		<tr className="border-b border-slate-100 dark:border-white/5">
			<td className="px-4 py-3">
				<p className="text-sm font-semibold text-slate-900 dark:text-white">
					{row.name ?? '—'}
				</p>
				<p className="text-xs text-slate-500 dark:text-gray-400">
					{row.email ?? '—'}
				</p>
			</td>
			<td className="px-4 py-3">
				<WaLink phone={row.phone} />
			</td>
			<td className="px-4 py-3">
				<span
					className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_CLS[row.status]}`}
				>
					{STATUS_LABEL[row.status]}
				</span>
			</td>
			<td className="px-4 py-3 text-xs text-slate-500 dark:text-gray-400 whitespace-nowrap">
				{fmtDate(row.current_period_end)}
				{row.cancel_at_period_end && (
					<span className="block text-[10px] text-amber-600 dark:text-amber-400">
						cancela no fim
					</span>
				)}
			</td>
			<td className="px-4 py-3 text-right">{actionBtn}</td>
		</tr>
	);
}

export function WaGroupAdminView() {
	const [page, setPage] = useState(0);
	const { data, isLoading } = useWaGroup(page);

	const rows = data?.rows ?? [];
	const total = data?.total ?? 0;
	const counts = data?.counts;
	const totalPages = Math.max(1, Math.ceil(total / WA_GROUP_PAGE_SIZE));

	const toAdd = rows.filter((r) => r.action === 'add');
	const toRemove = rows.filter((r) => r.action === 'remove');
	const rest = rows.filter((r) => r.action === null);

	return (
		<div className="space-y-6">
			{/* Counts */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<StatCard
					value={counts?.to_add ?? '—'}
					label="Para adicionar ao grupo"
					icon={UserPlus}
					color="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
				/>
				<StatCard
					value={counts?.to_remove ?? '—'}
					label="Para remover do grupo"
					icon={UserMinus}
					color="bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
				/>
				<StatCard
					value={counts?.in_group ?? '—'}
					label="No grupo"
					icon={Users}
					color="bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
				/>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-12">
					<Loader2 className="w-6 h-6 animate-spin text-violet-500" />
				</div>
			) : (
				<>
					{[
						{
							title: 'Adicionar ao grupo',
							desc: 'Assinatura ativa e ainda não marcado como no grupo.',
							list: toAdd,
							empty: 'Ninguém pendente de adição.',
						},
						{
							title: 'Remover do grupo',
							desc: 'Assinatura cancelada/inadimplente/pausada e ainda marcado como no grupo.',
							list: toRemove,
							empty: 'Ninguém pendente de remoção.',
						},
						{
							title: 'Demais assinantes',
							desc: 'Sem pendência (já no grupo ou fora do grupo).',
							list: rest,
							empty: 'Nada por aqui.',
						},
					].map((section) => (
						<div
							key={section.title}
							className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] overflow-hidden"
						>
							<div className="px-5 py-4 border-b border-slate-200 dark:border-white/10">
								<h3 className="text-sm font-bold text-slate-900 dark:text-white">
									{section.title}{' '}
									<span className="text-slate-400 dark:text-gray-500 font-medium">
										({section.list.length} nesta página)
									</span>
								</h3>
								<p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
									{section.desc}
								</p>
							</div>
							{section.list.length === 0 ? (
								<p className="text-sm text-slate-500 dark:text-gray-400 text-center py-6">
									{section.empty}
								</p>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full text-left">
										<thead>
											<tr className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-gray-500 border-b border-slate-100 dark:border-white/5">
												<th className="px-4 py-2 font-semibold">Cliente</th>
												<th className="px-4 py-2 font-semibold">WhatsApp</th>
												<th className="px-4 py-2 font-semibold">Assinatura</th>
												<th className="px-4 py-2 font-semibold">
													Fim do período
												</th>
												<th className="px-4 py-2" />
											</tr>
										</thead>
										<tbody>
											{section.list.map((row) => (
												<Row key={row.subscription_id} row={row} />
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					))}

					{/* Paginação */}
					{totalPages > 1 && (
						<div className="flex items-center justify-between">
							<p className="text-xs text-slate-500 dark:text-gray-400">
								{total} assinaturas no total
							</p>
							<div className="flex items-center gap-2">
								<button
									type="button"
									disabled={page === 0}
									onClick={() => setPage((p) => Math.max(0, p - 1))}
									className="p-2 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40"
								>
									<ChevronLeft className="w-4 h-4" />
								</button>
								<span className="text-xs text-slate-600 dark:text-gray-400">
									{page + 1} / {totalPages}
								</span>
								<button
									type="button"
									disabled={page + 1 >= totalPages}
									onClick={() => setPage((p) => p + 1)}
									className="p-2 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40"
								>
									<ChevronRight className="w-4 h-4" />
								</button>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
}
