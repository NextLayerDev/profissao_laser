'use client';

import { Layers, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
	useCreatePlan,
	useDeletePlan,
	usePlans,
	useUpdatePlan,
} from '../hooks/use-plans';
import type {
	CreatePlanPayload,
	Plan,
	UpdatePlanPayload,
} from '../types/plans';
import { PlanFormModal } from './plan-form-modal';

export function PlansAdminSection() {
	const { data: plans, isLoading, error } = usePlans();
	const createMut = useCreatePlan();
	const updateMut = useUpdatePlan();
	const deleteMut = useDeletePlan();

	const [editing, setEditing] = useState<Plan | null>(null);
	const [open, setOpen] = useState(false);

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<p className="text-sm text-slate-600 dark:text-gray-400">
					Tier templates (ex: <code>basic</code>, <code>pro</code>,{' '}
					<code>max</code>). Preço é definido na criação do plano.
				</p>
				<button
					type="button"
					onClick={() => {
						setEditing(null);
						setOpen(true);
					}}
					className="flex items-center gap-2 bg-violet-600 rounded-xl px-5 py-3 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
				>
					<Plus className="w-4 h-4" />
					Novo plano
				</button>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-16">
					<div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
				</div>
			) : error ? (
				<div className="text-center py-16">
					<p className="text-red-500 font-medium">Erro ao carregar planos</p>
				</div>
			) : (plans ?? []).length === 0 ? (
				<div className="text-center py-16">
					<Layers className="w-10 h-10 text-slate-400 dark:text-gray-700 mx-auto mb-4" />
					<p className="text-slate-600 dark:text-gray-400 font-medium">
						Nenhum plano criado
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{(plans ?? []).map((p) => (
						<PlanCard
							key={p.id}
							plan={p}
							onEdit={() => {
								setEditing(p);
								setOpen(true);
							}}
							onDelete={() => {
								if (
									confirm(
										`Remover o plano "${p.name}"? Essa ação não pode ser desfeita.`,
									)
								) {
									deleteMut.mutate(p.id);
								}
							}}
						/>
					))}
				</div>
			)}

			{open && (
				<PlanFormModal
					editing={editing}
					pending={createMut.isPending || updateMut.isPending}
					onClose={() => setOpen(false)}
					onSubmit={(payload) => {
						if (editing) {
							updateMut.mutate(
								{ id: editing.id, payload: payload as UpdatePlanPayload },
								{ onSuccess: () => setOpen(false) },
							);
						} else {
							createMut.mutate(payload as CreatePlanPayload, {
								onSuccess: () => setOpen(false),
							});
						}
					}}
				/>
			)}
		</div>
	);
}

function PlanCard({
	plan,
	onEdit,
	onDelete,
}: {
	plan: Plan;
	onEdit: () => void;
	onDelete: () => void;
}) {
	return (
		<div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-white via-violet-50/40 to-fuchsia-50/30 dark:from-[#1a1a1d] dark:via-violet-950/20 dark:to-fuchsia-950/10 p-5 flex flex-col">
			<div className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 rounded-full bg-violet-500/15 dark:bg-violet-500/10 blur-3xl" />
			<div className="pointer-events-none absolute -bottom-20 -left-10 w-40 h-40 rounded-full bg-fuchsia-500/10 dark:bg-fuchsia-500/10 blur-3xl" />

			<div className="relative flex flex-col flex-1">
				<Link href={`/planos/${plan.id}`} className="block">
					<div className="flex items-start justify-between gap-2">
						<div className="flex-1 min-w-0">
							<p className="font-bold text-slate-900 dark:text-white truncate">
								{plan.name}
							</p>
							<p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
								{plan.key}
							</p>
						</div>
						<span
							className={`shrink-0 text-xs px-2 py-1 rounded-md ${
								plan.published
									? 'bg-emerald-500/15 text-emerald-600'
									: 'bg-slate-500/15 text-slate-500'
							}`}
						>
							{plan.published ? 'Publicado' : 'Rascunho'}
						</span>
					</div>

					<p className="text-sm text-slate-500 mt-2 line-clamp-2">
						{plan.description ?? ''}
					</p>
				</Link>

				{(plan.price_monthly_cents != null ||
					plan.price_yearly_cents != null) && (
					<div className="flex items-center gap-3 mt-3">
						{plan.price_monthly_cents != null && (
							<div className="flex flex-col">
								<span className="text-[10px] font-medium text-slate-400 dark:text-gray-500 uppercase tracking-wide">
									Mensal
								</span>
								<span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
									R$ {(plan.price_monthly_cents / 100).toFixed(2)}
								</span>
							</div>
						)}
						{plan.price_monthly_cents != null &&
							plan.price_yearly_cents != null && (
								<div className="w-px h-6 bg-slate-200 dark:bg-white/10" />
							)}
						{plan.price_yearly_cents != null && (
							<div className="flex flex-col">
								<span className="text-[10px] font-medium text-slate-400 dark:text-gray-500 uppercase tracking-wide">
									Anual
								</span>
								<span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
									R$ {(plan.price_yearly_cents / 100).toFixed(2)}
								</span>
							</div>
						)}
					</div>
				)}

				<div className="mt-auto pt-4 flex gap-2">
					<button
						type="button"
						onClick={onEdit}
						className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10"
					>
						Editar
					</button>
					<button
						type="button"
						onClick={onDelete}
						className="text-sm px-3 py-2 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
					>
						<Trash2 className="w-4 h-4" />
					</button>
				</div>
			</div>
		</div>
	);
}
