'use client';

import { useState } from 'react';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import type {
	CreateToolPayload,
	Tool,
	UpdateToolPayload,
} from '../types/tools';

interface Props {
	editing: Tool | null;
	pending: boolean;
	onClose: () => void;
	onSubmit: (payload: CreateToolPayload | UpdateToolPayload) => void;
}

export function ToolFormModal({ editing, pending, onClose, onSubmit }: Props) {
	const [key, setKey] = useState(editing?.key ?? '');
	const [name, setName] = useState(editing?.name ?? '');
	const [description, setDescription] = useState(editing?.description ?? '');
	const [voxCost, setVoxCost] = useState(
		editing?.vox_cost != null ? String(editing.vox_cost) : '0',
	);
	const [enabled, setEnabled] = useState(editing?.enabled ?? true);

	const canSubmit =
		!pending && !!name.trim() && (editing !== null || !!key.trim());

	return (
		<ModalOverlay onClose={onClose} tone="tools">
			<div className="p-6 space-y-4">
				<h3 className="text-lg font-bold text-slate-900 dark:text-white">
					{editing ? 'Editar tool' : 'Nova tool'}
				</h3>

				<Field label="Key (snake_case)">
					<input
						value={key}
						onChange={(e) => setKey(e.target.value)}
						placeholder="ai_canvas, vectorize..."
						disabled={editing !== null}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm disabled:opacity-60 font-mono"
					/>
				</Field>

				<Field label="Nome">
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="AI Canvas"
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
					/>
				</Field>

				<Field label="Descrição (opcional)">
					<textarea
						value={description ?? ''}
						onChange={(e) => setDescription(e.target.value)}
						rows={3}
						placeholder="O que essa tool faz?"
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
					/>
				</Field>

				<Field label="Custo em voxxys por uso">
					<input
						type="number"
						min={0}
						value={voxCost}
						onChange={(e) => setVoxCost(e.target.value)}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
					/>
					<p className="text-xs text-slate-500 mt-1">
						Cobrado quando o usuário esgota a free_quota do plano.
					</p>
				</Field>

				<label className="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={enabled}
						onChange={(e) => setEnabled(e.target.checked)}
					/>
					Habilitada (pode ser invocada)
				</label>

				<div className="flex gap-3 pt-2">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-white/10"
					>
						Cancelar
					</button>
					<button
						type="button"
						disabled={!canSubmit}
						onClick={() => {
							const base = {
								name: name.trim(),
								description: description?.trim() || undefined,
								vox_cost: Math.max(0, Math.floor(Number(voxCost) || 0)),
								enabled,
							};
							onSubmit(editing ? base : { ...base, key: key.trim() });
						}}
						className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white disabled:opacity-60"
					>
						{pending ? 'Salvando...' : 'Salvar'}
					</button>
				</div>
			</div>
		</ModalOverlay>
	);
}

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: label wraps children implicitly
		<label className="block">
			<span className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5">
				{label}
			</span>
			{children}
		</label>
	);
}
