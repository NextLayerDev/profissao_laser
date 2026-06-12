'use client';

import { Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Role, RolePayload } from '@/modules/access';
import { usePermissionCatalog, useRoles } from '@/modules/access';
import { ModulesSection } from './modules-section';
import { RoleFormModal } from './role-form-modal';

interface RolesTabProps {
	canEdit: boolean;
}

export function RolesTab({ canEdit }: RolesTabProps) {
	const { roles, isLoading, createRole, updateRole, deleteRole, isMutating } =
		useRoles();
	const { data: catalog = [] } = usePermissionCatalog();

	const [showForm, setShowForm] = useState(false);
	const [editingRole, setEditingRole] = useState<Role | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

	const openCreate = () => {
		setEditingRole(null);
		setShowForm(true);
	};
	const openEdit = (role: Role) => {
		setEditingRole(role);
		setShowForm(true);
	};

	const handleSubmit = async (payload: RolePayload, id?: string) => {
		if (id) await updateRole({ id, payload });
		else await createRole(payload);
		setShowForm(false);
		setEditingRole(null);
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		try {
			await deleteRole(deleteTarget.id);
		} finally {
			setDeleteTarget(null);
		}
	};

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<p className="text-sm text-slate-600 dark:text-gray-400">
					Configure os padrões de permissão de cada cargo. Usuários herdam essas
					permissões (com exceções por usuário na aba Utilizadores).
				</p>
				{canEdit && (
					<button
						type="button"
						onClick={openCreate}
						className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors shrink-0"
					>
						<Plus className="w-4 h-4" />
						Novo cargo
					</button>
				)}
			</div>

			<ModulesSection canEdit={canEdit} />

			{isLoading ? (
				<div className="py-16 text-center text-slate-500 dark:text-gray-500">
					A carregar cargos...
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{roles.map((role) => (
						<div
							key={role.id}
							className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-4"
						>
							<div className="flex items-start justify-between gap-2">
								<div className="flex items-center gap-2 min-w-0">
									<div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-500/10 shrink-0">
										<ShieldCheck className="w-5 h-5 text-violet-600 dark:text-violet-400" />
									</div>
									<div className="min-w-0">
										<p className="font-semibold text-slate-900 dark:text-white truncate">
											{role.label || role.key}
										</p>
										<p className="text-xs text-slate-400 dark:text-gray-500">
											{role.key}
										</p>
									</div>
								</div>
								{canEdit && (
									<div className="flex items-center gap-1 shrink-0">
										<button
											type="button"
											onClick={() => openEdit(role)}
											title="Editar"
											className="p-1.5 rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-500/10"
										>
											<Pencil className="w-4 h-4" />
										</button>
										{!role.isSuperAdmin && (
											<button
												type="button"
												onClick={() => setDeleteTarget(role)}
												title="Excluir"
												className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-500/10"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										)}
									</div>
								)}
							</div>
							<p className="mt-3 text-sm text-slate-500 dark:text-gray-400">
								{role.isSuperAdmin
									? 'Acesso total (super admin)'
									: `${role.grants.length} permissões concedidas`}
							</p>
						</div>
					))}
				</div>
			)}

			<RoleFormModal
				role={editingRole}
				catalog={catalog}
				isOpen={showForm}
				isSaving={isMutating}
				onClose={() => {
					setShowForm(false);
					setEditingRole(null);
				}}
				onSubmit={handleSubmit}
			/>

			{deleteTarget && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
					<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md p-6">
						<h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
							Excluir cargo?
						</h3>
						<p className="text-sm text-slate-600 dark:text-gray-400 mb-6">
							O cargo "{deleteTarget.label || deleteTarget.key}" será excluído.
							Não é possível se houver usuários usando-o.
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
