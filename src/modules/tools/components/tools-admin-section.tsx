'use client';

import { Plus, Trash2, Wrench } from 'lucide-react';
import { useState } from 'react';
import { VoxxysIcon } from '@/components/ui/voxxys-icon';
import { useCreateTool, useDeleteTool } from '../hooks/use-tool-mutations';
import { useTools } from '../hooks/use-tools';
import { useUpdateTool } from '../hooks/use-update-tool';
import type {
	CreateToolPayload,
	Tool,
	UpdateToolPayload,
} from '../types/tools';
import { ToolFormModal } from './tool-form-modal';

export function ToolsAdminSection() {
	const { data: tools, isLoading, error } = useTools();
	const createMut = useCreateTool();
	const updateMut = useUpdateTool();
	const deleteMut = useDeleteTool();

	const [editing, setEditing] = useState<Tool | null>(null);
	const [open, setOpen] = useState(false);

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<p className="text-sm text-slate-600 dark:text-gray-400">
					Registry de funcionalidades pagas. Cada plano libera tools via
					entitlements; cobrança em voxxys acontece após a free_quota.
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
					Nova tool
				</button>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-16">
					<div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
				</div>
			) : error ? (
				<div className="text-center py-16">
					<p className="text-red-500 font-medium">Erro ao carregar tools</p>
				</div>
			) : (tools ?? []).length === 0 ? (
				<div className="text-center py-16">
					<Wrench className="w-10 h-10 text-slate-400 dark:text-gray-700 mx-auto mb-4" />
					<p className="text-slate-600 dark:text-gray-400 font-medium">
						Nenhuma tool criada
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{(tools ?? []).map((t) => (
						<ToolCard
							key={t.id}
							tool={t}
							onEdit={() => {
								setEditing(t);
								setOpen(true);
							}}
							onDelete={() => {
								if (
									confirm(
										`Remover a tool "${t.name}"? Planos que a usam ficarão sem o entitlement.`,
									)
								) {
									deleteMut.mutate(t.id);
								}
							}}
						/>
					))}
				</div>
			)}

			{open && (
				<ToolFormModal
					editing={editing}
					pending={createMut.isPending || updateMut.isPending}
					onClose={() => setOpen(false)}
					onSubmit={(payload) => {
						if (editing) {
							updateMut.mutate(
								{ id: editing.id, payload: payload as UpdateToolPayload },
								{ onSuccess: () => setOpen(false) },
							);
						} else {
							createMut.mutate(payload as CreateToolPayload, {
								onSuccess: () => setOpen(false),
							});
						}
					}}
				/>
			)}
		</div>
	);
}

function ToolCard({
	tool,
	onEdit,
	onDelete,
}: {
	tool: Tool;
	onEdit: () => void;
	onDelete: () => void;
}) {
	return (
		<div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-white via-emerald-50/40 to-cyan-50/30 dark:from-[#1a1a1d] dark:via-emerald-950/20 dark:to-cyan-950/10 p-5 flex flex-col">
			<div className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 rounded-full bg-emerald-500/15 dark:bg-emerald-500/10 blur-3xl" />
			<div className="pointer-events-none absolute -bottom-20 -left-10 w-40 h-40 rounded-full bg-cyan-500/10 dark:bg-cyan-500/10 blur-3xl" />

			<div className="relative flex flex-col flex-1">
				<div className="flex items-start justify-between gap-2">
					<div className="flex-1 min-w-0">
						<p className="font-bold text-slate-900 dark:text-white truncate">
							{tool.name}
						</p>
						<p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
							{tool.key}
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

				<div className="mt-3 flex items-center gap-1.5 text-sm text-slate-600 dark:text-gray-300">
					<VoxxysIcon className="w-4 h-4" />
					<span className="tabular-nums font-medium">{tool.vox_cost}</span>
					<span className="text-xs text-slate-500">voxxys/uso</span>
				</div>

				<div className="mt-auto pt-4 flex gap-2">
					<button
						type="button"
						onClick={onEdit}
						className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
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
