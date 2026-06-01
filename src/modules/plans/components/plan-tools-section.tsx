'use client';

import {
	Infinity as InfinityIcon,
	Pencil,
	Plus,
	Trash2,
	Wrench,
} from 'lucide-react';
import { useState } from 'react';
import { VoxxysIcon } from '@/components/ui/voxxys-icon';
import { useTools } from '@/modules/tools';
import { useRemovePlanTool, useSetPlanTool } from '../hooks/use-plan-tools';
import type { PlanEntitlement } from '../types/plan-details';
import { AddToolModal } from './add-tool-modal';

interface Props {
	planId: string;
	entitlements: PlanEntitlement[];
}

export function PlanToolsSection({ planId, entitlements }: Props) {
	const tools = useTools();
	const setMut = useSetPlanTool(planId);
	const removeMut = useRemovePlanTool(planId);

	const [addingOpen, setAddingOpen] = useState(false);

	const entitledKeys = entitlements.map((e) => e.tool_key);

	function updateQuota(toolKey: string, value: number | null) {
		setMut.mutate({ toolKey, payload: { free_quota: value } });
	}

	return (
		<section>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h3 className="text-lg font-semibold flex items-center gap-2">
						<Wrench className="w-5 h-5 text-violet-500" />
						Funcionalidades
					</h3>
					<p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
						Funcionalidades que este plano libera. Aqui você pode editar a cota
						grátis por mês de cada uma e marcar como ilimitada. O custo em
						voxxys é global e deve ser editado na aba de funcionalidades.
					</p>
				</div>
				<button
					type="button"
					onClick={() => setAddingOpen(true)}
					disabled={tools.isLoading}
					className="flex items-center gap-2 bg-violet-600 rounded-xl px-5 py-3 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60 transition-colors"
				>
					<Plus className="w-4 h-4" />
					Adicionar funcionalidade
				</button>
			</div>

			{entitlements.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-10 text-center">
					<Wrench className="w-8 h-8 text-slate-400 dark:text-gray-700 mx-auto mb-3" />
					<p className="text-sm text-slate-600 dark:text-gray-400 font-medium">
						Nenhuma funcionalidade
					</p>
					<p className="text-xs text-slate-500 mt-1">
						Adicione uma tool pra começar a configurar este plano.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{entitlements.map((e) => (
						<EntitlementCard
							key={e.tool_key}
							entitlement={e}
							onUpdateQuota={(v) => updateQuota(e.tool_key, v)}
							onRemove={() => {
								if (confirm(`Remover "${e.tool.name}" deste plano?`)) {
									removeMut.mutate(e.tool_key);
								}
							}}
							quotaPending={setMut.isPending}
							removePending={removeMut.isPending}
						/>
					))}
				</div>
			)}

			{addingOpen && (
				<AddToolModal
					excludeKeys={entitledKeys}
					pending={setMut.isPending}
					onClose={() => setAddingOpen(false)}
					onAdd={({ toolKey, free_quota }) => {
						setMut.mutate(
							{ toolKey, payload: { free_quota } },
							{ onSuccess: () => setAddingOpen(false) },
						);
					}}
				/>
			)}
		</section>
	);
}

function EntitlementCard({
	entitlement,
	onUpdateQuota,
	onRemove,
	quotaPending,
	removePending,
}: {
	entitlement: PlanEntitlement;
	onUpdateQuota: (value: number | null) => void;
	onRemove: () => void;
	quotaPending: boolean;
	removePending: boolean;
}) {
	const { tool, tool_key, free_quota } = entitlement;

	return (
		<div className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-white via-violet-50/40 to-fuchsia-50/30 dark:from-[#1a1a1d] dark:via-violet-950/20 dark:to-fuchsia-950/10 p-5 flex flex-col">
			<div className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 rounded-full bg-violet-500/15 dark:bg-violet-500/10 blur-3xl" />
			<div className="pointer-events-none absolute -bottom-20 -left-10 w-40 h-40 rounded-full bg-fuchsia-500/10 dark:bg-fuchsia-500/10 blur-3xl" />
			<div className="relative flex flex-col flex-1">
				{/* Header */}
				<div className="flex items-start justify-between gap-2">
					<div className="flex-1 min-w-0">
						<p className="font-bold text-slate-900 dark:text-white truncate">
							{tool.name}
						</p>
						<p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
							{tool_key}
						</p>
					</div>
					<span
						className={`shrink-0 text-xs px-2 py-1 rounded-md ${
							tool.enabled
								? 'bg-emerald-500/15 text-emerald-600'
								: 'bg-amber-500/15 text-amber-600'
						}`}
					>
						{tool.enabled ? 'Habilitada' : 'Desabilitada'}
					</span>
				</div>

				<p className="text-sm text-slate-500 mt-2 line-clamp-2 min-h-[2.5rem]">
					{tool.description ?? ''}
				</p>

				{/* Controls — empurrados pro fundo pra alinhar com outros cards */}
				<div className="mt-auto pt-4 grid grid-cols-2 gap-3">
					<CostDisplay value={tool.vox_cost} />
					<QuotaControl
						initial={free_quota}
						disabled={quotaPending}
						onCommit={onUpdateQuota}
					/>
				</div>

				{/* Footer */}
				<div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
					<p className="text-xs text-slate-500">
						Custo deve ser editado na aba de funcionalidades.
					</p>
					<button
						type="button"
						disabled={removePending}
						onClick={onRemove}
						className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-60"
					>
						<Trash2 className="w-3.5 h-3.5" />
						Remover
					</button>
				</div>
			</div>
		</div>
	);
}

function CostDisplay({ value }: { value: number }) {
	return (
		<div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0d0d0f] p-3">
			<div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1.5">
				<VoxxysIcon className="w-3.5 h-3.5" />
				Custo
			</div>
			<div className="flex items-baseline gap-1.5">
				<span className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums">
					{value}
				</span>
				<span className="text-xs text-slate-500">voxxys/uso</span>
			</div>
		</div>
	);
}

function QuotaControl({
	initial,
	disabled,
	onCommit,
}: {
	initial: number | null;
	disabled: boolean;
	onCommit: (value: number | null) => void;
}) {
	const [unlimited, setUnlimited] = useState(initial === null);
	const [draft, setDraft] = useState(initial === null ? '' : String(initial));

	function commit(nextUnlimited: boolean, nextDraft: string) {
		if (nextUnlimited) {
			onCommit(null);
			return;
		}
		const n = Number(nextDraft);
		if (!Number.isFinite(n)) return;
		onCommit(Math.max(0, Math.floor(n)));
	}

	return (
		<div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0d0d0f] p-3">
			<div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5">
				<span className="flex items-center gap-1.5">
					<InfinityIcon className="w-3.5 h-3.5 text-violet-500" />
					Cota grátis
				</span>
				<label className="flex items-center gap-1 cursor-pointer">
					<input
						type="checkbox"
						checked={unlimited}
						disabled={disabled}
						onChange={(e) => {
							const next = e.target.checked;
							setUnlimited(next);
							if (next) setDraft('');
							commit(next, draft);
						}}
						className="cursor-pointer"
					/>
					ilimitado
				</label>
			</div>
			<div className="flex items-center gap-1.5">
				<div className="flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-white/15 bg-white dark:bg-white/10 px-2 py-1 focus-within:border-violet-500">
					<input
						type="number"
						min={0}
						disabled={disabled || unlimited}
						value={unlimited ? '' : draft}
						placeholder={unlimited ? '∞' : '0'}
						onChange={(e) => setDraft(e.target.value)}
						onBlur={() => commit(unlimited, draft)}
						className="w-12 bg-transparent text-lg font-semibold text-slate-900 dark:text-white tabular-nums focus:outline-none disabled:opacity-50 disabled:placeholder:text-violet-400"
					/>
					{!unlimited && (
						<Pencil className="w-3.5 h-3.5 text-violet-500 shrink-0" />
					)}
				</div>
				<span className="text-xs text-slate-500">usos/mês</span>
			</div>
		</div>
	);
}
