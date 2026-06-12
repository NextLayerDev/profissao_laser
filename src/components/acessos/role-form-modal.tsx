'use client';

import { useEffect, useState } from 'react';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import type { PermissionModule, Role, RolePayload } from '@/modules/access';
import { PermissionMatrix } from './permission-matrix';

interface RoleFormModalProps {
	role: Role | null;
	catalog: PermissionModule[];
	isOpen: boolean;
	isSaving: boolean;
	onClose: () => void;
	onSubmit: (payload: RolePayload, id?: string) => Promise<void>;
}

export function RoleFormModal({
	role,
	catalog,
	isOpen,
	isSaving,
	onClose,
	onSubmit,
}: RoleFormModalProps) {
	const [name, setName] = useState('');
	const [label, setLabel] = useState('');
	const [isSuperAdmin, setIsSuperAdmin] = useState(false);
	const [grants, setGrants] = useState<string[]>([]);

	useEffect(() => {
		if (!isOpen) return;
		setName(role?.key ?? '');
		setLabel(role?.label ?? '');
		setIsSuperAdmin(role?.isSuperAdmin ?? false);
		setGrants(role?.grants ?? []);
	}, [isOpen, role]);

	if (!isOpen) return null;

	const isProtectedSuper = !!role?.isSuperAdmin;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;
		await onSubmit(
			{
				key: name.trim(),
				label: label.trim() || name.trim(),
				grants: isSuperAdmin ? [] : grants,
				isSuperAdmin,
			},
			role?.id,
		);
	};

	return (
		<ModalOverlay onClose={onClose} widthClassName="max-w-2xl">
			<form onSubmit={handleSubmit} className="p-6 space-y-4">
				<h3 className="text-lg font-bold text-slate-900 dark:text-white">
					{role ? 'Editar cargo' : 'Novo cargo'}
				</h3>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label
							htmlFor="role-name"
							className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5"
						>
							Identificador (role)
						</label>
						<input
							id="role-name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="ex: editor"
							disabled={isProtectedSuper}
							className="w-full bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50 disabled:opacity-60"
						/>
					</div>
					<div>
						<label
							htmlFor="role-label"
							className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5"
						>
							Nome de exibição
						</label>
						<input
							id="role-label"
							type="text"
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							placeholder="ex: Editor de conteúdo"
							className="w-full bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50"
						/>
					</div>
				</div>

				<label className="flex items-center gap-3 cursor-pointer">
					<input
						type="checkbox"
						checked={isSuperAdmin}
						disabled={isProtectedSuper}
						onChange={(e) => setIsSuperAdmin(e.target.checked)}
						className="w-4 h-4 rounded border-slate-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500/40 disabled:opacity-60"
					/>
					<span className="text-sm text-slate-700 dark:text-gray-300">
						Super admin (acesso total, ignora permissões individuais)
					</span>
				</label>

				{!isSuperAdmin && (
					<div>
						<p className="text-sm font-medium text-slate-600 dark:text-gray-400 mb-2">
							Permissões do cargo
						</p>
						<PermissionMatrix
							catalog={catalog}
							value={grants}
							onChange={setGrants}
						/>
					</div>
				)}

				<div className="flex gap-3 pt-2">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 px-5 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-[#252528] text-slate-700 dark:text-gray-300"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={isSaving || !name.trim()}
						className="flex-1 px-5 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
					>
						Guardar
					</button>
				</div>
			</form>
		</ModalOverlay>
	);
}
