'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	Check,
	Code2,
	Infinity as InfinityIcon,
	Loader2,
	Power,
	Save,
	Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { usePlans } from '@/modules/plans/hooks/use-plans';
import {
	listPlanTools,
	removePlanTool,
	setPlanTool,
} from '@/modules/plans/services/plan-tools.service';
import type { Plan } from '@/modules/plans/types/plans';
import { useUpdateTool } from '@/modules/tools/hooks/use-update-tool';
import { resolveToolIcon } from '@/modules/tools/lib/tool-icons';
import type { Tool } from '@/modules/tools/types/tools';
import { getApiErrorMessage } from '@/shared/lib/api-error';

const field =
	'w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40';

function PlanQuotaRow({ tool, plan }: { tool: Tool; plan: Plan }) {
	const qc = useQueryClient();
	const q = useQuery({
		queryKey: ['plan-tools', plan.id],
		queryFn: () => listPlanTools(plan.id),
	});
	const row = q.data?.find((pt) => pt.tool_key === tool.key);
	const present = !!row;
	const [val, setVal] = useState<number | null>(row?.free_quota ?? 0);

	// biome-ignore lint/correctness/useExhaustiveDependencies: sync local state with fetched quota
	useEffect(() => {
		setVal(row?.free_quota ?? 0);
	}, [row?.free_quota, q.isSuccess]);

	const saveMut = useMutation({
		mutationFn: () => setPlanTool(plan.id, tool.key, { free_quota: val }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['plan-tools', plan.id] });
			qc.invalidateQueries({ queryKey: ['entitlements'] });
			toast.success(`Cota salva (${plan.name})`);
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Falha ao salvar cota')),
	});
	const removeMut = useMutation({
		mutationFn: () => removePlanTool(plan.id, tool.key),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['plan-tools', plan.id] });
			qc.invalidateQueries({ queryKey: ['entitlements'] });
			toast.success(`Removida do ${plan.name}`);
		},
		onError: (err) => toast.error(getApiErrorMessage(err, 'Falha ao remover')),
	});

	const unlimited = val === null;
	return (
		<div className="rounded-xl border border-white/10 bg-black/20 p-3">
			<div className="flex items-center justify-between">
				<span className="text-sm font-medium text-slate-200">{plan.name}</span>
				<button
					type="button"
					onClick={() => setVal(unlimited ? 0 : null)}
					className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md ${
						unlimited
							? 'bg-cyan-500/15 text-cyan-300'
							: 'bg-white/5 text-slate-500'
					}`}
				>
					<InfinityIcon className="h-3 w-3" /> ilimitado
				</button>
			</div>
			<div className="mt-2 flex items-center gap-2">
				<input
					type="number"
					min={0}
					disabled={unlimited}
					value={unlimited ? '' : (val ?? 0)}
					onChange={(e) => setVal(Math.max(0, Number(e.target.value)))}
					placeholder={unlimited ? '∞' : '0'}
					className="w-20 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-sm text-slate-100 disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
				/>
				<span className="text-xs text-slate-500">grátis / mês</span>
				<button
					type="button"
					onClick={() => saveMut.mutate()}
					disabled={saveMut.isPending}
					className="ml-auto flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-300"
				>
					{saveMut.isPending ? (
						<Loader2 className="h-3 w-3 animate-spin" />
					) : (
						<Check className="h-3 w-3" />
					)}
					Salvar
				</button>
				{present && (
					<button
						type="button"
						onClick={() => removeMut.mutate()}
						disabled={removeMut.isPending}
						title="Remover do plano"
						className="rounded-md p-1 text-slate-500 hover:text-rose-400"
					>
						<Trash2 className="h-3.5 w-3.5" />
					</button>
				)}
			</div>
		</div>
	);
}

export function ToolBillingPanel({ tool }: { tool: Tool }) {
	const Icon = resolveToolIcon();
	const [name, setName] = useState(tool.name);
	const [voxCost, setVoxCost] = useState(tool.vox_cost);
	const [enabled, setEnabled] = useState(tool.enabled);
	const plans = usePlans();
	const updateMut = useUpdateTool();

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset form when selecting another tool
	useEffect(() => {
		setName(tool.name);
		setVoxCost(tool.vox_cost);
		setEnabled(tool.enabled);
	}, [tool.id]);

	return (
		<div className="space-y-5">
			<div className="forge-rise rounded-2xl border border-white/10 bg-[#0c0f12]/80 p-5">
				<div className="flex items-center gap-3 mb-4">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-500/15 text-slate-300 ring-1 ring-white/10">
						<Icon className="h-5 w-5" />
					</div>
					<div className="min-w-0 flex-1">
						<h2 className="text-base font-semibold text-white truncate">
							{tool.name}
						</h2>
						<span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
							<Code2 className="h-3 w-3" /> {tool.key} · ferramenta de código
						</span>
					</div>
				</div>
				<p className="mb-4 text-xs text-slate-500">
					Esta ferramenta roda código próprio (não blocos), então não tem
					builder visual — mas você ajusta o preço, liga/desliga e a cota por
					plano aqui.
				</p>

				<div className="grid sm:grid-cols-2 gap-3">
					<div className="sm:col-span-2">
						<label
							htmlFor="bp-name"
							className="block text-[11px] font-medium text-slate-400 mb-1"
						>
							Nome
						</label>
						<input
							id="bp-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className={field}
						/>
					</div>
					<div>
						<label
							htmlFor="bp-cost"
							className="block text-[11px] font-medium text-slate-400 mb-1"
						>
							Custo por uso (vox)
						</label>
						<input
							id="bp-cost"
							type="number"
							step={0.05}
							min={0}
							value={voxCost}
							onChange={(e) => setVoxCost(Math.max(0, Number(e.target.value)))}
							className={`${field} font-mono text-amber-200`}
						/>
					</div>
					<div className="flex items-end">
						<button
							type="button"
							onClick={() => setEnabled((v) => !v)}
							className={`flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
								enabled
									? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
									: 'border-white/10 bg-white/5 text-slate-400'
							}`}
						>
							<Power className="h-4 w-4" />
							{enabled ? 'Habilitada' : 'Desabilitada'}
						</button>
					</div>
				</div>

				<button
					type="button"
					onClick={() =>
						updateMut.mutate({
							id: tool.id,
							payload: { name, vox_cost: voxCost, enabled },
						})
					}
					disabled={updateMut.isPending}
					className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2.5 text-sm font-bold text-[#06120f] disabled:opacity-50"
				>
					{updateMut.isPending ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Save className="h-4 w-4" />
					)}
					Salvar
				</button>
			</div>

			<div className="forge-rise rounded-2xl border border-white/10 bg-[#0c0f12]/80 p-5">
				<h3 className="mb-3 font-mono text-[10px] tracking-widest text-slate-500 uppercase">
					Cota grátis por plano
				</h3>
				{plans.isLoading ? (
					<div className="flex justify-center p-4">
						<Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
						{plans.data?.map((p) => (
							<PlanQuotaRow key={p.id} tool={tool} plan={p} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}
