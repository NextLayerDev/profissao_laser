'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	AlertTriangle,
	ArrowDown,
	GitBranch,
	Pencil,
	Plus,
	Trash2,
	X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	createProcessFlow,
	createProcessStep,
	deleteProcessFlow,
	deleteProcessStep,
	listProcessFlows,
	updateProcessStep,
} from '@/modules/mentoria/service';
import type { MntProcessStep } from '@/modules/mentoria/types';
import {
	BTN_GHOST,
	BTN_PRIMARY,
	CARD,
	EmptyState,
	INPUT,
	LABEL,
	MntSkeleton,
} from '../shared';

type StepForm = {
	name: string;
	owner_name: string;
	deadline: string;
	problem_note: string;
};

const EMPTY_STEP: StepForm = {
	name: '',
	owner_name: '',
	deadline: '',
	problem_note: '',
};

/** Ferramenta process_flow: fluxogramas com etapas em sequência vertical. */
export function ToolProcessFlow({ instanceId }: { instanceId: string }) {
	const qc = useQueryClient();
	const queryKey = ['mentoria', 'process-flows', instanceId];
	const invalidate = () => qc.invalidateQueries({ queryKey });

	const { data: flows, isLoading } = useQuery({
		queryKey,
		queryFn: () => listProcessFlows(instanceId),
	});

	const [newFlowName, setNewFlowName] = useState('');
	const createFlow = useMutation({
		mutationFn: () =>
			createProcessFlow(instanceId, { name: newFlowName.trim() }),
		onSuccess: () => {
			setNewFlowName('');
			invalidate();
			toast.success('Fluxograma criado!');
		},
		onError: () => toast.error('Não foi possível criar o fluxograma.'),
	});

	const removeFlow = useMutation({
		mutationFn: deleteProcessFlow,
		onSuccess: invalidate,
		onError: () => toast.error('Não foi possível excluir o fluxograma.'),
	});

	if (isLoading) return <MntSkeleton />;

	return (
		<div className="space-y-5">
			<div className={`${CARD} p-4 flex flex-wrap items-end gap-3`}>
				<div className="flex-1 min-w-52">
					<label className={LABEL} htmlFor="mnt-new-flow">
						Novo fluxograma de processo
					</label>
					<input
						id="mnt-new-flow"
						className={INPUT}
						value={newFlowName}
						onChange={(e) => setNewFlowName(e.target.value)}
						placeholder="Ex.: Do pedido à entrega"
					/>
				</div>
				<button
					type="button"
					className={BTN_PRIMARY}
					onClick={() => createFlow.mutate()}
					disabled={!newFlowName.trim() || createFlow.isPending}
				>
					<Plus className="w-4 h-4" />
					Criar fluxo
				</button>
			</div>

			{(flows ?? []).length === 0 ? (
				<EmptyState
					icon={GitBranch}
					title="Nenhum fluxograma ainda"
					description="Desenhe o passo a passo dos processos da sua empresa — do pedido à entrega."
				/>
			) : (
				(flows ?? []).map((flow) => (
					<FlowCard
						key={flow.id}
						flow={flow}
						onDelete={() => removeFlow.mutate(flow.id)}
						onChanged={invalidate}
					/>
				))
			)}
		</div>
	);
}

function FlowCard({
	flow,
	onDelete,
	onChanged,
}: {
	flow: {
		id: string;
		name: string;
		description: string | null;
		steps: MntProcessStep[];
	};
	onDelete: () => void;
	onChanged: () => void;
}) {
	const [adding, setAdding] = useState(false);
	const [editingStep, setEditingStep] = useState<MntProcessStep | null>(null);
	const [form, setForm] = useState<StepForm>(EMPTY_STEP);

	const addStep = useMutation({
		mutationFn: () =>
			createProcessStep(flow.id, {
				name: form.name.trim(),
				owner_name: form.owner_name || null,
				deadline: form.deadline || null,
				problem_note: form.problem_note || null,
			}),
		onSuccess: () => {
			setForm(EMPTY_STEP);
			setAdding(false);
			onChanged();
		},
		onError: () => toast.error('Não foi possível adicionar a etapa.'),
	});

	const saveStep = useMutation({
		mutationFn: () =>
			updateProcessStep((editingStep as MntProcessStep).id, {
				name: form.name.trim(),
				owner_name: form.owner_name || null,
				deadline: form.deadline || null,
				problem_note: form.problem_note || null,
			}),
		onSuccess: () => {
			setEditingStep(null);
			setForm(EMPTY_STEP);
			onChanged();
		},
		onError: () => toast.error('Não foi possível salvar a etapa.'),
	});

	const removeStep = useMutation({
		mutationFn: deleteProcessStep,
		onSuccess: onChanged,
		onError: () => toast.error('Não foi possível remover a etapa.'),
	});

	const steps = [...flow.steps].sort((a, b) => a.position - b.position);

	const startEdit = (step: MntProcessStep) => {
		setAdding(false);
		setEditingStep(step);
		setForm({
			name: step.name,
			owner_name: step.owner_name ?? '',
			deadline: step.deadline ?? '',
			problem_note: step.problem_note ?? '',
		});
	};

	return (
		<section className={`${CARD} p-5`}>
			<div className="flex items-center justify-between gap-3 mb-4">
				<h3 className="inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
					<GitBranch className="w-4 h-4 text-teal-600 dark:text-teal-400" />
					{flow.name}
				</h3>
				<button
					type="button"
					className="text-slate-400 hover:text-red-500 transition"
					onClick={onDelete}
					title="Excluir fluxograma"
				>
					<Trash2 className="w-4 h-4" />
				</button>
			</div>

			{steps.length === 0 && (
				<p className="text-sm text-slate-400 dark:text-gray-500 mb-3">
					Sem etapas ainda — adicione a primeira.
				</p>
			)}

			<div className="flex flex-col items-stretch max-w-md">
				{steps.map((step, idx) => (
					<div key={step.id}>
						{idx > 0 && (
							<div className="flex justify-center py-1">
								<ArrowDown className="w-4 h-4 text-slate-300 dark:text-gray-600" />
							</div>
						)}
						<div className="rounded-xl border border-slate-200 dark:border-white/10 p-3 flex items-start justify-between gap-2">
							<div className="min-w-0">
								<p className="text-sm font-medium text-slate-900 dark:text-slate-100">
									{idx + 1}. {step.name}
								</p>
								<p className="text-xs text-slate-500 dark:text-gray-400">
									{step.owner_name ? `Responsável: ${step.owner_name}` : null}
									{step.owner_name && step.deadline ? ' · ' : null}
									{step.deadline ? `Prazo: ${step.deadline}` : null}
								</p>
								{step.problem_note && (
									<p className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mt-1">
										<AlertTriangle className="w-3 h-3 shrink-0" />
										{step.problem_note}
									</p>
								)}
							</div>
							<div className="flex gap-1 shrink-0">
								<button
									type="button"
									className="text-slate-400 hover:text-teal-500 transition"
									onClick={() => startEdit(step)}
									title="Editar etapa"
								>
									<Pencil className="w-3.5 h-3.5" />
								</button>
								<button
									type="button"
									className="text-slate-400 hover:text-red-500 transition"
									onClick={() => removeStep.mutate(step.id)}
									title="Remover etapa"
								>
									<Trash2 className="w-3.5 h-3.5" />
								</button>
							</div>
						</div>
					</div>
				))}
			</div>

			{adding || editingStep ? (
				<div className="mt-4 rounded-xl border border-teal-500/30 bg-teal-500/5 p-4 space-y-3 max-w-md">
					<div className="flex items-center justify-between">
						<p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
							{editingStep ? 'Editar etapa' : 'Nova etapa'}
						</p>
						<button
							type="button"
							className="text-slate-400 hover:text-slate-600"
							onClick={() => {
								setAdding(false);
								setEditingStep(null);
								setForm(EMPTY_STEP);
							}}
						>
							<X className="w-4 h-4" />
						</button>
					</div>
					<input
						className={INPUT}
						value={form.name}
						onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
						placeholder="Nome da etapa *"
					/>
					<div className="grid grid-cols-2 gap-3">
						<input
							className={INPUT}
							value={form.owner_name}
							onChange={(e) =>
								setForm((f) => ({ ...f, owner_name: e.target.value }))
							}
							placeholder="Responsável"
						/>
						<input
							className={INPUT}
							value={form.deadline}
							onChange={(e) =>
								setForm((f) => ({ ...f, deadline: e.target.value }))
							}
							placeholder="Prazo (ex.: 2 dias)"
						/>
					</div>
					<input
						className={INPUT}
						value={form.problem_note}
						onChange={(e) =>
							setForm((f) => ({ ...f, problem_note: e.target.value }))
						}
						placeholder="Problema/gargalo nesta etapa?"
					/>
					<button
						type="button"
						className={BTN_PRIMARY}
						disabled={
							!form.name.trim() || addStep.isPending || saveStep.isPending
						}
						onClick={() => (editingStep ? saveStep.mutate() : addStep.mutate())}
					>
						{editingStep ? 'Salvar etapa' : 'Adicionar etapa'}
					</button>
				</div>
			) : (
				<button
					type="button"
					className={`${BTN_GHOST} mt-4`}
					onClick={() => setAdding(true)}
				>
					<Plus className="w-4 h-4" />
					Adicionar etapa
				</button>
			)}
		</section>
	);
}
