'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, ShieldCheck, Trash2, Users2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CreateUserModal } from '@/components/acessos/create-user-modal';
import { DeleteUserModal } from '@/components/acessos/delete-user-modal';
import { EditUserModal } from '@/components/acessos/edit-user-modal';
import { RolesTab } from '@/components/acessos/roles-tab';
import { Header } from '@/components/dashboard/header';
import { usePermissions } from '@/modules/access';
import type { AppUser } from '@/modules/users';
import { deleteUser, usersQueryKeys, useTeamUsers } from '@/modules/users';

type Tab = 'users' | 'roles';

export default function AcessosPage() {
	const router = useRouter();
	const { can, isLoading: permissionsLoading } = usePermissions();
	const allowed = can('acessos.view');
	const canEdit = can('acessos.edit');
	const canDelete = can('acessos.delete');

	const { data: users = [], isLoading: usersLoading, error } = useTeamUsers();

	const panelUsers = users;

	const [tab, setTab] = useState<Tab>('users');
	const [showCreate, setShowCreate] = useState(false);
	const [editUser, setEditUser] = useState<AppUser | null>(null);
	const [deleteUserTarget, setDeleteUserTarget] = useState<AppUser | null>(
		null,
	);

	const queryClient = useQueryClient();
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		if (!permissionsLoading && !allowed) {
			router.replace('/dashboard');
		}
	}, [allowed, permissionsLoading, router]);

	async function handleDelete(id: string) {
		setIsDeleting(true);
		try {
			await deleteUser(id);
			queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });
			setDeleteUserTarget(null);
		} finally {
			setIsDeleting(false);
		}
	}

	if (permissionsLoading || !allowed) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-slate-600 dark:text-gray-400">A carregar...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />

			<main className="px-4 md:px-8 py-6">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
							<ShieldCheck className="w-6 h-6 text-violet-400" />
							Gestão de Acessos
						</h2>
						<p className="text-slate-600 dark:text-gray-400 mt-1">
							Gerencie utilizadores e configure os padrões de cada cargo.
						</p>
					</div>
					{tab === 'users' && canEdit && (
						<button
							type="button"
							onClick={() => setShowCreate(true)}
							className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors"
						>
							<Plus className="w-4 h-4" />
							Novo utilizador
						</button>
					)}
				</div>

				{/* Tabs */}
				<div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-white/10">
					<button
						type="button"
						onClick={() => setTab('users')}
						className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
							tab === 'users'
								? 'border-violet-500 text-violet-600 dark:text-violet-400'
								: 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200'
						}`}
					>
						<Users2 className="w-4 h-4" />
						Utilizadores
					</button>
					<button
						type="button"
						onClick={() => setTab('roles')}
						className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
							tab === 'roles'
								? 'border-violet-500 text-violet-600 dark:text-violet-400'
								: 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200'
						}`}
					>
						<ShieldCheck className="w-4 h-4" />
						Cargos & Permissões
					</button>
				</div>

				{tab === 'roles' ? (
					<RolesTab canEdit={canEdit} />
				) : (
					<>
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
											<th className="px-4 py-3 font-medium text-right">
												Ações
											</th>
										</tr>
									</thead>
									<tbody>
										{panelUsers.length === 0 && (
											<tr>
												<td
													colSpan={4}
													className="px-4 py-10 text-center text-slate-500 dark:text-gray-500"
												>
													Nenhum utilizador encontrado.
												</td>
											</tr>
										)}
										{panelUsers.map((user) => (
											<tr
												key={user.id}
												className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/2 transition-colors"
											>
												<td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
													{user.name ?? '—'}
												</td>
												<td className="px-4 py-3 text-slate-600 dark:text-gray-400">
													{user.email}
												</td>
												<td className="px-4 py-3 text-slate-500 dark:text-gray-500">
													{user.access_role?.label || (
														<span className="capitalize">{user.role}</span>
													)}
												</td>
												<td className="px-4 py-3 text-right">
													<div className="flex items-center justify-end gap-2">
														{canEdit && (
															<button
																type="button"
																onClick={() => setEditUser(user)}
																className="p-2 text-slate-500 dark:text-gray-400 hover:text-violet-500 hover:bg-violet-500/10 rounded-lg transition-colors"
																title="Editar"
															>
																<Pencil className="w-4 h-4" />
															</button>
														)}
														{canDelete && (
															<button
																type="button"
																onClick={() => setDeleteUserTarget(user)}
																className="p-2 text-slate-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
																title="Excluir"
															>
																<Trash2 className="w-4 h-4" />
															</button>
														)}
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</>
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
