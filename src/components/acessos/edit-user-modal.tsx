'use client';

import { Loader2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
	usePermissionCatalog,
	useRoles,
	useUserAccess,
} from '@/modules/access';
import type { AppUser } from '@/modules/users';
import { PermissionMatrix } from './permission-matrix';

interface EditUserModalProps {
	user: AppUser | null;
	isOpen: boolean;
	onClose: () => void;
}

export function EditUserModal({ user, isOpen, onClose }: EditUserModalProps) {
	const { roles } = useRoles(isOpen);
	const { data: catalog = [] } = usePermissionCatalog(isOpen);
	const { access, isLoading, updateAccess, isSaving } = useUserAccess(
		isOpen ? (user?.id ?? null) : null,
	);

	const [roleId, setRoleId] = useState<string | null>(null);
	const [effective, setEffective] = useState<string[]>([]);

	const allKeys = useMemo(
		() => catalog.flatMap((m) => m.actions.map((a) => `${m.module}.${a}`)),
		[catalog],
	);

	const selectedRole = roles.find((r) => r.id === roleId) ?? null;

	// Inicializa o formulário UMA vez por usuário (quando os dados chegam). Um
	// guard por id evita que um refetch em background (ex.: foco da janela)
	// sobrescreva edições não salvas. Sem cargo atribuído, fica em branco —
	// força uma escolha explícita em vez de pré-selecionar um cargo arbitrário.
	const initializedFor = useRef<string | null>(null);
	useEffect(() => {
		if (!isOpen) {
			initializedFor.current = null;
			return;
		}
		if (!user || isLoading || roles.length === 0 || allKeys.length === 0) {
			return;
		}
		if (initializedFor.current === user.id) return;
		initializedFor.current = user.id;

		const rid = access?.roleId ?? null;
		setRoleId(rid);
		const role = roles.find((r) => r.id === rid) ?? null;
		if (role?.isSuperAdmin) {
			setEffective(allKeys);
		} else {
			const base = new Set(role?.grants ?? []);
			for (const k of access?.overrides.granted ?? []) base.add(k);
			for (const k of access?.overrides.revoked ?? []) base.delete(k);
			setEffective([...base]);
		}
	}, [isOpen, user, isLoading, access, roles, allKeys]);

	if (!isOpen || !user) return null;

	function handleRoleChange(id: string) {
		setRoleId(id);
		const role = roles.find((r) => r.id === id) ?? null;
		setEffective(role?.isSuperAdmin ? allKeys : (role?.grants ?? []));
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!user || roleId == null) return;

		const base = new Set(selectedRole?.grants ?? []);
		const effSet = new Set(effective);
		const overrides = selectedRole?.isSuperAdmin
			? { granted: [], revoked: [] }
			: {
					granted: effective.filter((k) => !base.has(k)),
					revoked: [...base].filter((k) => !effSet.has(k)),
				};

		await updateAccess({ id: user.id, payload: { roleId, overrides } });
		onClose();
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<button
				type="button"
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
				onKeyDown={(e) => {
					if (e.key === 'Escape') onClose();
				}}
			>
				<span className="sr-only">Fechar modal</span>
			</button>

			<div className="relative bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-xl font-bold text-slate-900 dark:text-white">
						Acesso do utilizador
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-2 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-[#252528]"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="mb-4 text-sm text-slate-600 dark:text-gray-400">
					<p className="font-medium text-slate-900 dark:text-white">
						{user.name ?? '—'}
					</p>
					<p>{user.email}</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label
							htmlFor="edit-role"
							className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5"
						>
							Cargo
						</label>
						<select
							id="edit-role"
							value={roleId ?? ''}
							onChange={(e) => handleRoleChange(e.target.value)}
							className="w-full bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50 appearance-none"
						>
							<option value="" disabled>
								Selecione um cargo
							</option>
							{roles.map((r) => (
								<option key={r.id} value={r.id}>
									{r.label || r.key}
								</option>
							))}
						</select>
					</div>

					<div>
						<div className="flex items-center justify-between mb-2">
							<p className="text-sm font-medium text-slate-600 dark:text-gray-400">
								Permissões deste usuário
							</p>
							{!selectedRole?.isSuperAdmin && (
								<span className="text-xs text-slate-400 dark:text-gray-500">
									Começa do cargo; ajuste para criar exceções
								</span>
							)}
						</div>
						{selectedRole?.isSuperAdmin ? (
							<p className="text-sm text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 rounded-xl px-4 py-3">
								Cargo super admin: acesso total a tudo.
							</p>
						) : (
							<PermissionMatrix
								catalog={catalog}
								value={effective}
								onChange={setEffective}
								disabled={isSaving}
							/>
						)}
					</div>

					<div className="flex gap-3 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-5 py-3 rounded-xl font-medium text-sm bg-slate-100 dark:bg-[#252528] text-slate-700 dark:text-gray-300"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isSaving || isLoading || roleId == null}
							className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
						>
							{isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
							Guardar
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
