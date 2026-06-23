'use client';

import { ChevronDown, Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
	type PermissionModule,
	type PermissionModulePayload,
	usePermissionModules,
} from '@/modules/access';
import { ModuleFormModal } from './module-form-modal';

interface ModulesSectionProps {
	canEdit: boolean;
}

/**
 * Gestão do catálogo de módulos de permissão, dentro da aba "Cargos &
 * Permissões". Recolhível para não competir com a lista de cargos.
 */
export function ModulesSection({ canEdit }: ModulesSectionProps) {
	const {
		modules,
		isLoading,
		createModule,
		updateModule,
		deleteModule,
		isMutating,
	} = usePermissionModules();

	const [open, setOpen] = useState(false);
	const [showForm, setShowForm] = useState(false);
	const [editing, setEditing] = useState<PermissionModule | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<PermissionModule | null>(
		null,
	);

	const openCreate = () => {
		setEditing(null);
		setShowForm(true);
	};
	const openEdit = (mod: PermissionModule) => {
		setEditing(mod);
		setShowForm(true);
	};

	const handleSubmit = async (
		payload: PermissionModulePayload,
		id?: string,
	) => {
		if (id) await updateModule({ id, payload });
		else await createModule(payload);
		setShowForm(false);
		setEditing(null);
	};

	const handleDelete = async () => {
		if (!deleteTarget?.id) return;
		try {
			await deleteModule(deleteTarget.id);
		} finally {
			setDeleteTarget(null);
		}
	};

	return (
		<div className="mb-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d]">
			<div className="flex items-center justify-between p-4">
				<button
					type="button"
					onClick={() => setOpen((v) => !v)}
					className="flex items-center gap-2 min-w-0 text-left"
				>
					<Layers className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0" />
					<span className="font-semibold text-slate-900 dark:text-white">
						Módulos de permissão
					</span>
					<span className="text-xs text-slate-400 dark:text-gray-500">
						({modules.length})
					</span>
					<ChevronDown
						className={`w-4 h-4 text-slate-400 transition-transform ${
							open ? 'rotate-180' : ''
						}`}
					/>
				</button>
				{open && canEdit && (
					<button
						type="button"
						onClick={openCreate}
						className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors shrink-0"
					>
						<Plus className="w-4 h-4" />
						Novo módulo
					</button>
				)}
			</div>

			{open && (
				<div className="px-4 pb-4">
					{isLoading ? (
						<p className="py-6 text-center text-sm text-slate-500 dark:text-gray-500">
							A carregar módulos...
						</p>
					) : modules.length === 0 ? (
						<p className="py-6 text-center text-sm text-slate-500 dark:text-gray-500">
							Nenhum módulo cadastrado.
						</p>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
							{modules.map((mod) => (
								<div
									key={mod.module}
									className="rounded-xl border border-slate-200 dark:border-white/10 p-3"
								>
									<div className="flex items-start justify-between gap-2">
										<div className="min-w-0">
											<p className="font-medium text-slate-900 dark:text-white truncate">
												{mod.label}
											</p>
											<p className="text-xs text-slate-400 dark:text-gray-500 truncate">
												{mod.module}
											</p>
										</div>
										{canEdit && mod.id && (
											<div className="flex items-center gap-1 shrink-0">
												<button
													type="button"
													onClick={() => openEdit(mod)}
													title="Editar"
													className="p-1.5 rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-500/10"
												>
													<Pencil className="w-4 h-4" />
												</button>
												<button
													type="button"
													onClick={() => setDeleteTarget(mod)}
													title="Excluir"
													className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-500/10"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</div>
										)}
									</div>
									<div className="mt-2 flex flex-wrap gap-1">
										{mod.actions.map((a) => (
											<span
												key={a}
												className="px-2 py-0.5 rounded-md text-xs bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400"
											>
												{a}
											</span>
										))}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			<ModuleFormModal
				module={editing}
				isOpen={showForm}
				isSaving={isMutating}
				onClose={() => {
					setShowForm(false);
					setEditing(null);
				}}
				onSubmit={handleSubmit}
			/>

			{deleteTarget && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
					<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md p-6">
						<h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
							Excluir módulo?
						</h3>
						<p className="text-sm text-slate-600 dark:text-gray-400 mb-6">
							O módulo "{deleteTarget.label}" será excluído. Não é possível se
							algum cargo usar as permissões dele.
						</p>
						<div className="flex gap-3">
							<button
								type="button"
								onClick={() => setDeleteTarget(null)}
								className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={handleDelete}
								disabled={isMutating}
								className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium disabled:opacity-50"
							>
								Excluir
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
