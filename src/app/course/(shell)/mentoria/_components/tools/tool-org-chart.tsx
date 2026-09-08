'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Network, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	createOrgPosition,
	deleteOrgPosition,
	listOrgPositions,
	updateOrgPosition,
} from '@/modules/mentoria/service';
import type { MntOrgPosition } from '@/modules/mentoria/types';
import {
	BTN_GHOST,
	BTN_PRIMARY,
	CARD,
	EmptyState,
	INPUT,
	LABEL,
	MntSkeleton,
} from '../shared';

type PositionForm = {
	title: string;
	holder_name: string;
	responsibilities: string;
	kpi_names: string;
	parent_id: string;
};

const EMPTY_FORM: PositionForm = {
	title: '',
	holder_name: '',
	responsibilities: '',
	kpi_names: '',
	parent_id: '',
};

/** Ferramenta org_chart: organograma em árvore (cargos e responsáveis). */
export function ToolOrgChart({ instanceId }: { instanceId: string }) {
	const qc = useQueryClient();
	const queryKey = ['mentoria', 'org-positions', instanceId];
	const invalidate = () => qc.invalidateQueries({ queryKey });

	const { data: positions, isLoading } = useQuery({
		queryKey,
		queryFn: () => listOrgPositions(instanceId),
	});

	const [editing, setEditing] = useState<MntOrgPosition | null>(null);
	const [adding, setAdding] = useState(false);
	const [form, setForm] = useState<PositionForm>(EMPTY_FORM);

	const save = useMutation({
		mutationFn: () => {
			const body = {
				title: form.title.trim(),
				holder_name: form.holder_name || null,
				responsibilities: form.responsibilities || null,
				kpi_names: form.kpi_names || null,
				parent_id: form.parent_id || null,
			};
			return editing
				? updateOrgPosition(editing.id, body)
				: createOrgPosition(instanceId, body);
		},
		onSuccess: () => {
			setForm(EMPTY_FORM);
			setAdding(false);
			setEditing(null);
			invalidate();
			toast.success('Cargo salvo!');
		},
		onError: () => toast.error('Não foi possível salvar o cargo.'),
	});

	const remove = useMutation({
		mutationFn: deleteOrgPosition,
		onSuccess: invalidate,
		onError: () =>
			toast.error(
				'Não foi possível remover o cargo. Remova primeiro os cargos abaixo dele.',
			),
	});

	if (isLoading) return <MntSkeleton />;

	const all = positions ?? [];
	const roots = all.filter(
		(p) => !p.parent_id || !all.some((o) => o.id === p.parent_id),
	);
	const childrenOf = (id: string) => all.filter((p) => p.parent_id === id);

	const startEdit = (p: MntOrgPosition) => {
		setAdding(false);
		setEditing(p);
		setForm({
			title: p.title,
			holder_name: p.holder_name ?? '',
			responsibilities: p.responsibilities ?? '',
			kpi_names: p.kpi_names ?? '',
			parent_id: p.parent_id ?? '',
		});
	};

	const renderNode = (p: MntOrgPosition, depth: number) => (
		<div key={p.id} style={{ marginLeft: depth > 0 ? 24 : 0 }}>
			<div
				className={`rounded-xl border p-3 mb-2 flex items-start justify-between gap-2 ${
					depth === 0
						? 'border-teal-500/40 bg-teal-500/5'
						: 'border-slate-200 dark:border-white/10'
				}`}
			>
				<div className="min-w-0">
					<p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
						{p.title}
					</p>
					<p className="text-xs text-slate-500 dark:text-gray-400">
						{p.holder_name ? p.holder_name : 'Sem responsável definido'}
					</p>
					{p.responsibilities && (
						<p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
							Responsabilidades: {p.responsibilities}
						</p>
					)}
					{p.kpi_names && (
						<p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">
							Indicadores: {p.kpi_names}
						</p>
					)}
				</div>
				<div className="flex gap-1 shrink-0">
					<button
						type="button"
						className="text-slate-400 hover:text-teal-500 transition"
						onClick={() => startEdit(p)}
						title="Editar cargo"
					>
						<Pencil className="w-3.5 h-3.5" />
					</button>
					<button
						type="button"
						className="text-slate-400 hover:text-red-500 transition"
						onClick={() => remove.mutate(p.id)}
						title="Remover cargo"
					>
						<Trash2 className="w-3.5 h-3.5" />
					</button>
				</div>
			</div>
			{childrenOf(p.id).map((c) => renderNode(c, depth + 1))}
		</div>
	);

	return (
		<div className="space-y-5">
			{all.length === 0 ? (
				<EmptyState
					icon={Network}
					title="Organograma vazio"
					description="Comece pelo cargo do topo (ex.: Dono / Diretor) e vá adicionando os cargos abaixo — mesmo que hoje várias funções sejam da mesma pessoa."
				/>
			) : (
				<section className={`${CARD} p-5`}>
					<h3 className="inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100 mb-4">
						<Network className="w-4 h-4 text-teal-600 dark:text-teal-400" />
						Organograma da empresa
					</h3>
					{roots.map((p) => renderNode(p, 0))}
				</section>
			)}

			{adding || editing ? (
				<div className={`${CARD} p-5 space-y-3 max-w-lg`}>
					<div className="flex items-center justify-between">
						<p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
							{editing ? 'Editar cargo' : 'Novo cargo'}
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
					<input
						className={INPUT}
						value={form.title}
						onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
						placeholder="Nome do cargo * (ex.: Produção)"
					/>
					<input
						className={INPUT}
						value={form.holder_name}
						onChange={(e) =>
							setForm((f) => ({ ...f, holder_name: e.target.value }))
						}
						placeholder="Quem ocupa hoje (ex.: Maria)"
					/>
					<textarea
						className={INPUT}
						rows={2}
						value={form.responsibilities}
						onChange={(e) =>
							setForm((f) => ({ ...f, responsibilities: e.target.value }))
						}
						placeholder="Principais responsabilidades"
					/>
					<input
						className={INPUT}
						value={form.kpi_names}
						onChange={(e) =>
							setForm((f) => ({ ...f, kpi_names: e.target.value }))
						}
						placeholder="Indicadores do cargo (ex.: peças/dia, retrabalho)"
					/>
					<div>
						<label className={LABEL} htmlFor="mnt-org-parent">
							Responde para
						</label>
						<select
							id="mnt-org-parent"
							className={INPUT}
							value={form.parent_id}
							onChange={(e) =>
								setForm((f) => ({ ...f, parent_id: e.target.value }))
							}
						>
							<option value="">Ninguém (topo do organograma)</option>
							{all
								.filter((p) => p.id !== editing?.id)
								.map((p) => (
									<option key={p.id} value={p.id}>
										{p.title}
										{p.holder_name ? ` (${p.holder_name})` : ''}
									</option>
								))}
						</select>
					</div>
					<button
						type="button"
						className={BTN_PRIMARY}
						disabled={!form.title.trim() || save.isPending}
						onClick={() => save.mutate()}
					>
						{save.isPending ? 'Salvando...' : 'Salvar cargo'}
					</button>
				</div>
			) : (
				<button
					type="button"
					className={BTN_GHOST}
					onClick={() => setAdding(true)}
				>
					<Plus className="w-4 h-4" />
					Adicionar cargo
				</button>
			)}
		</div>
	);
}
