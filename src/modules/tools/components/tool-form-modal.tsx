'use client';

import { useState } from 'react';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { parseVox } from '@/lib/format';
import { useTools } from '../hooks/use-tools';
import { SYSTEM_TOOLS, systemToolFor } from '../system-tools';
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
		editing?.vox_cost != null
			? String(editing.vox_cost).replace('.', ',')
			: '0',
	);
	const [platformCost, setPlatformCost] = useState(
		editing?.platform_cost_cents != null
			? (editing.platform_cost_cents / 100).toFixed(2).replace('.', ',')
			: '0',
	);
	const [enabled, setEnabled] = useState(editing?.enabled ?? true);

	// Só dá pra associar ferramentas do catálogo ainda não registradas.
	const { data: registeredTools } = useTools();
	const available = SYSTEM_TOOLS.filter(
		(st) => !(registeredTools ?? []).some((t) => t.key === st.key),
	);

	const canSubmit =
		!pending && !!name.trim() && (editing !== null || !!key.trim());

	return (
		<ModalOverlay onClose={onClose} tone="tools">
			<div className="p-6 space-y-4">
				<h3 className="text-lg font-bold text-slate-900 dark:text-white">
					{editing ? 'Editar funcionalidade' : 'Nova funcionalidade'}
				</h3>

				<Field label="Ferramenta do sistema">
					{editing ? (
						<input
							value={systemToolFor(key)?.label ?? key}
							disabled
							className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white disabled:opacity-60"
						/>
					) : (
						<select
							value={key}
							onChange={(e) => {
								const k = e.target.value;
								setKey(k);
								const st = systemToolFor(k);
								if (st) {
									if (!name.trim()) setName(st.label);
									if (!description?.trim()) setDescription(st.description);
								}
							}}
							className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] px-3 py-2 text-sm text-slate-900 dark:text-white"
						>
							<option value="">Selecione a ferramenta…</option>
							{available.map((st) => (
								<option key={st.key} value={st.key}>
									{st.label}
								</option>
							))}
						</select>
					)}
					<p className="text-xs text-slate-500 mt-1">
						Qual ferramenta do sistema essa funcionalidade cobra. Ferramenta sem
						funcionalidade roda livre (sem voxxys).
					</p>
				</Field>

				<Field label="Nome">
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="AI Canvas"
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
					/>
				</Field>

				<Field label="Descrição (opcional)">
					<textarea
						value={description ?? ''}
						onChange={(e) => setDescription(e.target.value)}
						rows={3}
						placeholder="O que essa funcionalidade faz?"
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
					/>
				</Field>

				<Field label="Custo em voxxys por uso">
					<input
						type="text"
						inputMode="decimal"
						value={voxCost}
						onChange={(e) => setVoxCost(e.target.value)}
						placeholder="0,3"
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
					/>
					<p className="text-xs text-slate-500 mt-1">
						Aceita decimal (ex.: 0,3). Cobrado quando o usuário esgota a
						free_quota do plano.
					</p>
				</Field>

				<Field label="Custo plataforma (R$) por uso">
					<input
						type="text"
						inputMode="decimal"
						value={platformCost}
						onChange={(e) => setPlatformCost(e.target.value)}
						placeholder="0,30"
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
					/>
					<p className="text-xs text-slate-500 mt-1">
						Custo REAL da plataforma por uso (ex.: 0,30 = R$ 0,30). Vai pra
						fatura aberta quando o uso consome voxxys doados via Link de Plano.
					</p>
				</Field>

				<label className="flex items-center gap-2 text-sm text-slate-900 dark:text-white">
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
						className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
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
								vox_cost: parseVox(voxCost),
								platform_cost_cents: Math.round(parseVox(platformCost) * 100),
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
