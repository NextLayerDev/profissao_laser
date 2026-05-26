'use client';

import { Loader2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { usePermissionCatalog, useRoles } from '@/hooks/use-roles';
import type { User } from '@/types/users';
import { PermissionMatrix } from './permission-matrix';

interface EditUserSavePayload {
	name: string;
	email: string;
	role: string;
	Permissions: number | null;
	overrides: { granted: string[]; revoked: string[] };
}

interface EditUserModalProps {
	user: User | null;
	isOpen: boolean;
	onClose: () => void;
	onSave: (id: string, payload: EditUserSavePayload) => Promise<void>;
}

export function EditUserModal({
	user,
	isOpen,
	onClose,
	onSave,
}: EditUserModalProps) {
	const { roles } = useRoles(isOpen);
	const { data: catalog = [] } = usePermissionCatalog(isOpen);

	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [permId, setPermId] = useState<number | null>(null);
	const [effective, setEffective] = useState<string[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const allKeys = useMemo(
		() => catalog.flatMap((m) => m.actions.map((a) => `${m.module}.${a}`)),
		[catalog],
	);

	const selectedRole = roles.find((r) => r.id === permId) ?? null;

	// Inicializa a partir do usuário (cargo + overrides) quando abre / roles carregam.
	useEffect(() => {
		if (!isOpen || !user) return;
		setName(user.name);
		setEmail(user.email);
		const pid = user.Permissions ?? roles[0]?.id ?? null;
		setPermId(pid);
		const role = roles.find((r) => r.id === pid) ?? null;
		if (role?.isSuperAdmin) {
			setEffective(allKeys);
		} else {
			const base = new Set(role?.grants ?? []);
			for (const k of user.overrides?.granted ?? []) base.add(k);
			for (const k of user.overrides?.revoked ?? []) base.delete(k);
			setEffective([...base]);
		}
	}, [isOpen, user, roles, allKeys]);

	if (!isOpen || !user) return null;

	function handleRoleChange(id: number) {
		setPermId(id);
		const role = roles.find((r) => r.id === id) ?? null;
		// Ao trocar de cargo, parte dos padrões do novo cargo (sem overrides).
		setEffective(role?.isSuperAdmin ? allKeys : (role?.grants ?? []));
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!user || !name.trim() || !email.trim() || permId == null) return;

		// Override = diff entre o conjunto efetivo escolhido e os grants do cargo.
		const base = new Set(selectedRole?.grants ?? []);
		const effSet = new Set(effective);
		const overrides = selectedRole?.isSuperAdmin
			? { granted: [], revoked: [] }
			: {
					granted: effective.filter((k) => !base.has(k)),
					revoked: [...base].filter((k) => !effSet.has(k)),
				};

		setIsSubmitting(true);
		try {
			await onSave(user.id, {
				name: name.trim(),
				email: email.trim(),
				role: selectedRole?.role ?? user.role,
				Permissions: permId,
				overrides,
			});
			toast.success('Utilizador atualizado com sucesso.');
			onClose();
		} catch {
			toast.error('Erro ao atualizar utilizador.');
		} finally {
			setIsSubmitting(false);
		}
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
						Editar utilizador
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-2 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-[#252528]"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label
								htmlFor="edit-name"
								className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5"
							>
								Nome
							</label>
							<input
								id="edit-name"
								type="text"
								required
								minLength={2}
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="w-full bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50"
							/>
						</div>
						<div>
							<label
								htmlFor="edit-email"
								className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5"
							>
								E-mail
							</label>
							<input
								id="edit-email"
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50"
							/>
						</div>
					</div>

					<div>
						<label
							htmlFor="edit-role"
							className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5"
						>
							Cargo
						</label>
						<select
							id="edit-role"
							value={permId ?? ''}
							onChange={(e) =>
								handleRoleChange(Number.parseInt(e.target.value, 10))
							}
							className="w-full bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50 appearance-none"
						>
							{roles.map((r) => (
								<option key={r.id} value={r.id}>
									{r.label || r.role} (ID {r.id})
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
							disabled={isSubmitting}
							className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
						>
							{isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
							Guardar
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
