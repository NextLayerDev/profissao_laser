'use client';

import { Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { User } from '@/types/users';
import { ROLES } from '@/utils/constants/roles';

interface EditUserModalProps {
	user: User | null;
	isOpen: boolean;
	onClose: () => void;
	onSave: (
		id: string,
		payload: {
			name: string;
			email: string;
			role: string;
			Permissions: number | null;
		},
	) => Promise<void>;
}

export function EditUserModal({
	user,
	isOpen,
	onClose,
	onSave,
}: EditUserModalProps) {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [role, setRole] = useState(ROLES[0].role);
	const [permissions, setPermissions] = useState(ROLES[0].id);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (user) {
			setName(user.name);
			setEmail(user.email);
			const roleConfig =
				ROLES.find((r) => r.id === (user.Permissions ?? 0)) ?? ROLES[0];
			setRole(user.role || roleConfig.role);
			setPermissions(user.Permissions ?? roleConfig.id);
		}
	}, [user]);

	if (!isOpen || !user) return null;

	function handleRoleChange(newRole: string) {
		const config = ROLES.find((r) => r.role === newRole);
		if (config) {
			setRole(config.role);
			setPermissions(config.id);
		}
	}

	function handlePermissionsChange(permId: number) {
		const config = ROLES.find((r) => r.id === permId);
		if (config) {
			setPermissions(config.id);
			setRole(config.role);
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!user || !name.trim() || !email.trim()) return;

		setIsSubmitting(true);
		try {
			await onSave(user.id, {
				name: name.trim(),
				email: email.trim(),
				role,
				Permissions: permissions,
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
		<div className="fixed inset-0 z-50 flex items-center justify-center">
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

			<div className="relative bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
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
							placeholder="Nome completo"
							className="w-full bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
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
							placeholder="email@exemplo.com"
							className="w-full bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
						/>
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
							value={role}
							onChange={(e) => handleRoleChange(e.target.value)}
							className="w-full bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50 transition-colors appearance-none"
						>
							{ROLES.map((r) => (
								<option key={r.id} value={r.role}>
									{r.role}
								</option>
							))}
						</select>
					</div>

					<div>
						<label
							htmlFor="edit-permissions"
							className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5"
						>
							Permissões
						</label>
						<select
							id="edit-permissions"
							value={permissions}
							onChange={(e) =>
								handlePermissionsChange(Number.parseInt(e.target.value, 10))
							}
							className="w-full bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50 transition-colors appearance-none"
						>
							{ROLES.map((r) => (
								<option key={r.id} value={r.id}>
									{r.role} (ID {r.id})
								</option>
							))}
						</select>
					</div>

					<div className="flex gap-3 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-5 py-3 rounded-xl font-medium text-sm bg-slate-100 dark:bg-[#252528] hover:bg-slate-200 dark:hover:bg-[#2a2a2d] text-slate-700 dark:text-gray-300 transition-colors"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50"
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
