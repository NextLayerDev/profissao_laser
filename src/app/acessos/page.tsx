'use client';

import { Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CreateUserModal } from '@/components/acessos/create-user-modal';
import { DeleteUserModal } from '@/components/acessos/delete-user-modal';
import { EditUserModal } from '@/components/acessos/edit-user-modal';
import { Header } from '@/components/dashboard/header';
import { usePermissions } from '@/hooks/use-permissions';
import { useUsers } from '@/hooks/use-users';
import type { User } from '@/types/users';
import { getRoleByPermissionId } from '@/utils/constants/roles';

export default function AcessosPage() {
	const router = useRouter();
	const { canAdmin, isLoading: permissionsLoading } = usePermissions();
	const {
		users,
		isLoading: usersLoading,
		error,
		updateUser,
		deleteUser,
		isDeleting,
	} = useUsers();

	const [showCreate, setShowCreate] = useState(false);
	const [editUser, setEditUser] = useState<User | null>(null);
	const [deleteUserTarget, setDeleteUserTarget] = useState<User | null>(null);

	useEffect(() => {
		if (!permissionsLoading && !canAdmin) {
			router.replace('/');
		}
	}, [canAdmin, permissionsLoading, router]);

	async function handleSave(
		id: string,
		payload: {
			name: string;
			email: string;
			role: string;
			Permissions: number | null;
		},
	) {
		await updateUser({ id, payload });
		setEditUser(null);
	}

	async function handleDelete(id: string) {
		await deleteUser(id);
		setDeleteUserTarget(null);
	}

	if (permissionsLoading || !canAdmin) {
		return (
			<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] flex items-center justify-center">
				<div className="text-slate-600 dark:text-gray-400">A carregar...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] text-slate-900 dark:text-white font-sans">
			<Header />

			<main className="px-8 py-6">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
							<ShieldCheck className="w-6 h-6 text-violet-400" />
							Gestão de Acessos
						</h2>
						<p className="text-slate-600 dark:text-gray-400 mt-1">
							Crie, edite e exclua utilizadores e permissões.
						</p>
					</div>
					<button
						type="button"
						onClick={() => setShowCreate(true)}
						className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors"
					>
						<Plus className="w-4 h-4" />
						Novo utilizador
					</button>
				</div>

				{usersLoading && (
					<div className="flex justify-center py-20 text-slate-600 dark:text-gray-400">
						A carregar utilizadores...
					</div>
				)}

				{error && (
					<div className="flex justify-center py-20 text-red-400">
						Erro ao carregar utilizadores.
					</div>
				)}

				{!usersLoading && !error && (
					<div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-transparent shadow-sm dark:shadow-none">
						<table className="w-full text-sm">
							<thead>
								<tr className="bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-gray-400 text-left">
									<th className="px-4 py-3 font-medium">Nome</th>
									<th className="px-4 py-3 font-medium">E-mail</th>
									<th className="px-4 py-3 font-medium">Cargo</th>
									<th className="px-4 py-3 font-medium">Permissões</th>
									<th className="px-4 py-3 font-medium text-right">Ações</th>
								</tr>
							</thead>
							<tbody>
								{(!users || users.length === 0) && (
									<tr>
										<td
											colSpan={5}
											className="px-4 py-10 text-center text-slate-500 dark:text-gray-500"
										>
											Nenhum utilizador encontrado.
										</td>
									</tr>
								)}
								{users?.map((user) => {
									const roleConfig = getRoleByPermissionId(user.Permissions);
									return (
										<tr
											key={user.id}
											className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/2 transition-colors"
										>
											<td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
												{user.name}
											</td>
											<td className="px-4 py-3 text-slate-600 dark:text-gray-400">
												{user.email}
											</td>
											<td className="px-4 py-3 text-slate-900 dark:text-white">
												{user.role}
											</td>
											<td className="px-4 py-3 text-slate-600 dark:text-gray-400">
												{roleConfig?.role ?? `ID ${user.Permissions ?? '—'}`}
											</td>
											<td className="px-4 py-3 text-right">
												<div className="flex items-center justify-end gap-2">
													<button
														type="button"
														onClick={() => setEditUser(user)}
														className="p-2 text-slate-500 dark:text-gray-400 hover:text-violet-500 hover:bg-violet-500/10 rounded-lg transition-colors"
														title="Editar"
													>
														<Pencil className="w-4 h-4" />
													</button>
													<button
														type="button"
														onClick={() => setDeleteUserTarget(user)}
														className="p-2 text-slate-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
														title="Excluir"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</main>

			<CreateUserModal
				isOpen={showCreate}
				onClose={() => setShowCreate(false)}
			/>
			<EditUserModal
				user={editUser}
				isOpen={!!editUser}
				onClose={() => setEditUser(null)}
				onSave={handleSave}
			/>
			<DeleteUserModal
				user={deleteUserTarget}
				isOpen={!!deleteUserTarget}
				onClose={() => setDeleteUserTarget(null)}
				onDelete={handleDelete}
				isDeleting={isDeleting}
			/>
		</div>
	);
}
