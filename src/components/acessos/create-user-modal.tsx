'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { registerUser } from '@/services/auth';
import { ROLES } from '@/utils/constants/roles';

interface CreateUserModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function CreateUserModal({ isOpen, onClose }: CreateUserModalProps) {
	const queryClient = useQueryClient();
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [role, setRole] = useState(ROLES[0].role);
	const [permissions, setPermissions] = useState(ROLES[0].id);

	const mutation = useMutation({
		mutationFn: (payload: {
			name: string;
			email: string;
			password: string;
			role: string;
			Permissions: number | null;
		}) => registerUser(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users'] });
			toast.success('Utilizador criado com sucesso.');
			handleClose();
		},
		onError: () => {
			toast.error('Erro ao criar utilizador.');
		},
	});

	if (!isOpen) return null;

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

	function handleClose() {
		setName('');
		setEmail('');
		setPassword('');
		setRole(ROLES[0].role);
		setPermissions(ROLES[0].id);
		onClose();
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim() || !email.trim() || !password.trim()) return;
		if (password.length < 6) return;

		mutation.mutate({
			name: name.trim(),
			email: email.trim(),
			password,
			role,
			Permissions: permissions,
		});
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<button
				type="button"
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={handleClose}
				onKeyDown={(e) => {
					if (e.key === 'Escape') handleClose();
				}}
			>
				<span className="sr-only">Fechar modal</span>
			</button>

			<div className="relative bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-xl font-bold text-slate-900 dark:text-white">
						Novo utilizador
					</h2>
					<button
						type="button"
						onClick={handleClose}
						className="p-2 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-[#252528]"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label
							htmlFor="create-name"
							className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5"
						>
							Nome
						</label>
						<input
							id="create-name"
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
							htmlFor="create-email"
							className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5"
						>
							E-mail
						</label>
						<input
							id="create-email"
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
							htmlFor="create-password"
							className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5"
						>
							Senha
						</label>
						<input
							id="create-password"
							type="password"
							required
							minLength={6}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Mínimo 6 caracteres"
							className="w-full bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
						/>
					</div>

					<div>
						<label
							htmlFor="create-role"
							className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5"
						>
							Cargo
						</label>
						<select
							id="create-role"
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
							htmlFor="create-permissions"
							className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5"
						>
							Permissões
						</label>
						<select
							id="create-permissions"
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
							onClick={handleClose}
							className="flex-1 px-5 py-3 rounded-xl font-medium text-sm bg-slate-100 dark:bg-[#252528] hover:bg-slate-200 dark:hover:bg-[#2a2a2d] text-slate-700 dark:text-gray-300 transition-colors"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={mutation.isPending}
							className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50"
						>
							{mutation.isPending && (
								<Loader2 className="w-4 h-4 animate-spin" />
							)}
							Criar utilizador
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
