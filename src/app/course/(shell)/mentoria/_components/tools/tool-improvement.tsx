'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	createImprovement,
	listImprovements,
	updateImprovement,
} from '@/modules/mentoria/service';
import type { MntImprovementCycle } from '@/modules/mentoria/types';
import {
	BTN_GHOST,
	BTN_PRIMARY,
	CARD,
	EmptyState,
	INPUT,
	LABEL,
	MntSkeleton,
} from '../shared';

const STATUS_LABEL: Record<MntImprovementCycle['status'], string> = {
	open: 'Aberto',
	in_progress: 'Em andamento',
	done: 'Concluído',
};

const STATUS_BADGE: Record<MntImprovementCycle['status'], string> = {
	open: 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300',
	in_progress: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
	done: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

type CycleForm = {
	problem: string;
	root_cause: string;
	action_plan: string;
	owner_name: string;
	deadline: string;
	result: string;
	status: MntImprovementCycle['status'];
	standardized: boolean;
};

const EMPTY_FORM: CycleForm = {
	problem: '',
	root_cause: '',
	action_plan: '',
	owner_name: '',
	deadline: '',
	result: '',
	status: 'open',
	standardized: false,
};

/** Ferramenta continuous_improvement: ciclos de melhoria (problema → causa → ação → resultado). */
export function ToolImprovement({ instanceId }: { instanceId: string }) {
	const qc = useQueryClient();
	const queryKey = ['mentoria', 'improvements', instanceId];
	const invalidate = () => qc.invalidateQueries({ queryKey });

	const { data: cycles, isLoading } = useQuery({
		queryKey,
		queryFn: () => listImprovements(instanceId),
	});

	const [adding, setAdding] = useState(false);
	const [editing, setEditing] = useState<MntImprovementCycle | null>(null);
	const [form, setForm] = useState<CycleForm>(EMPTY_FORM);

	const save = useMutation({
		mutationFn: () => {
			const body = {
				problem: form.problem.trim(),
				root_cause: form.root_cause || null,
				action_plan: form.action_plan || null,
				owner_name: form.owner_name || null,
				deadline: form.deadline || null,
				result: form.result || null,
				status: form.status,
				standardized: form.standardized,
			};
			return editing
				? updateImprovement(editing.id, body)
				: createImprovement(instanceId, body);
		},
		onSuccess: () => {
			setForm(EMPTY_FORM);
			setAdding(false);
			setEditing(null);
			invalidate();
			toast.success('Ciclo de melhoria salvo!');
		},
		onError: () => toast.error('Não foi possível salvar o ciclo.'),
	});

	if (isLoading) return <MntSkeleton />;

	const startEdit = (c: MntImprovementCycle) => {
		setAdding(false);
		setEditing(c);
		setForm({
			problem: c.problem,
			root_cause: c.root_cause ?? '',
			action_plan: c.action_plan ?? '',
			owner_name: c.owner_name ?? '',
			deadline: c.deadline ?? '',
			result: c.result ?? '',
			status: c.status,
			standardized: c.standardized,
		});
	};

	return (
		<div className="space-y-5">
			{(cycles ?? []).length === 0 ? (
				<EmptyState
					icon={RefreshCw}
					title="Nenhum ciclo de melhoria ainda"
					description="Registre um problema real da empresa, investigue a causa raiz, defina o plano de ação e acompanhe o resultado. Quando funcionar, padronize num POP."
				/>
			) : (
				(cycles ?? []).map((c) => (
					<section key={c.id} className={`${CARD} p-5`}>
						<div className="flex items-start justify-between gap-3 mb-3">
							<div className="min-w-0">
								<p className="font-semibold text-slate-900 dark:text-slate-100">
									{c.problem}
								</p>
								<p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
									{c.owner_name ? `Responsável: ${c.owner_name}` : null}
									{c.owner_name && c.deadline ? ' · ' : null}
									{c.deadline ? `Prazo: ${c.deadline}` : null}
								</p>
							</div>
							<div className="flex items-center gap-2 shrink-0">
								<span
									className={`text-xs font-medium rounded-full px-2.5 py-1 ${STATUS_BADGE[c.status]}`}
								>
									{STATUS_LABEL[c.status]}
								</span>
								<button
									type="button"
									className="text-slate-400 hover:text-teal-500 transition"
									onClick={() => startEdit(c)}
									title="Editar ciclo"
								>
									<Pencil className="w-4 h-4" />
								</button>
							</div>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
							<CyclePart label="Causa raiz" value={c.root_cause} />
							<CyclePart label="Plano de ação" value={c.action_plan} />
							<CyclePart label="Resultado" value={c.result} />
						</div>
						{c.standardized && (
							<p className="text-xs text-teal-600 dark:text-teal-400 mt-3">
								✓ Solução padronizada (virou procedimento)
							</p>
						)}
					</section>
				))
			)}

			{adding || editing ? (
				<div className={`${CARD} p-5 space-y-3 max-w-2xl`}>
					<div className="flex items-center justify-between">
						<p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
							{editing ? 'Editar ciclo de melhoria' : 'Novo ciclo de melhoria'}
						</p>
						<button
							type="button"
							className="text-slate-400 hover:text-slate-600"
							onClick={() => {
								setAdding(false);
								setEditing(null);
								setForm(EMPTY_FORM);
							}}
						>
							<X className="w-4 h-4" />
						</button>
					</div>
					<textarea
						className={INPUT}
						rows={2}
						value={form.problem}
						onChange={(e) =>
							setForm((f) => ({ ...f, problem: e.target.value }))
						}
						placeholder="Qual é o problema? * (ex.: atraso na entrega dos pedidos personalizados)"
					/>
					<textarea
						className={INPUT}
						rows={2}
						value={form.root_cause}
						onChange={(e) =>
							setForm((f) => ({ ...f, root_cause: e.target.value }))
						}
						placeholder="Causa raiz (pergunte 'por quê?' até chegar na origem)"
					/>
					<textarea
						className={INPUT}
						rows={2}
						value={form.action_plan}
						onChange={(e) =>
							setForm((f) => ({ ...f, action_plan: e.target.value }))
						}
						placeholder="Plano de ação (o que será feito, por quem, como)"
					/>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<input
							className={INPUT}
							value={form.owner_name}
							onChange={(e) =>
								setForm((f) => ({ ...f, owner_name: e.target.value }))
							}
							placeholder="Responsável"
						/>
						<input
							type="date"
							className={INPUT}
							value={form.deadline}
							onChange={(e) =>
								setForm((f) => ({ ...f, deadline: e.target.value }))
							}
						/>
					</div>
					<textarea
						className={INPUT}
						rows={2}
						value={form.result}
						onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))}
						placeholder="Resultado obtido (preencha após executar a ação)"
					/>
					<div className="flex flex-wrap items-center gap-4">
						<div>
							<label className={LABEL} htmlFor="mnt-imp-status">
								Status
							</label>
							<select
								id="mnt-imp-status"
								className={INPUT}
								value={form.status}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										status: e.target.value as MntImprovementCycle['status'],
									}))
								}
							>
								<option value="open">Aberto</option>
								<option value="in_progress">Em andamento</option>
								<option value="done">Concluído</option>
							</select>
						</div>
						<label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 mt-5">
							<input
								type="checkbox"
								className="accent-teal-600"
								checked={form.standardized}
								onChange={(e) =>
									setForm((f) => ({ ...f, standardized: e.target.checked }))
								}
							/>
							Solução padronizada (virou POP)
						</label>
					</div>
					<button
						type="button"
						className={BTN_PRIMARY}
						disabled={!form.problem.trim() || save.isPending}
						onClick={() => save.mutate()}
					>
						{save.isPending ? 'Salvando...' : 'Salvar ciclo'}
					</button>
				</div>
			) : (
				<button
					type="button"
					className={BTN_GHOST}
					onClick={() => setAdding(true)}
				>
					<Plus className="w-4 h-4" />
					Novo ciclo de melhoria
				</button>
			)}
		</div>
	);
}

function CyclePart({ label, value }: { label: string; value: string | null }) {
	return (
		<div className="rounded-xl border border-slate-200 dark:border-white/10 p-3">
			<p className="text-xs uppercase tracking-wide text-slate-400 dark:text-gray-500 mb-1">
				{label}
			</p>
			<p className="text-slate-700 dark:text-slate-300">
				{value || <span className="text-slate-400 dark:text-gray-500">—</span>}
			</p>
		</div>
	);
}
