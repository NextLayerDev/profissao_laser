'use client';

import {
	KeyRound,
	Search,
	ShieldCheck,
	ShieldOff,
	Trash2,
	Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BlockCustomerModal } from '@/components/alunos/block-customer-modal';
import { ChangePasswordModal } from '@/components/alunos/change-password-modal';
import { DeleteCustomerModal } from '@/components/alunos/delete-customer-modal';
import { Header } from '@/components/dashboard/header';
import { useCustomers } from '@/hooks/use-customers';
import { usePermissions } from '@/hooks/use-permissions';
import type { Customer, CustomerSubscription } from '@/types/customer';

const STATUS_LABELS: Record<string, string> = {
	active: 'Ativo',
	trialing: 'Em teste',
	canceled: 'Cancelado',
	past_due: 'Vencido',
	incomplete: 'Incompleto',
	incomplete_expired: 'Expirado',
	paused: 'Pausado',
	unpaid: 'Não pago',
};

const STATUS_COLORS: Record<string, string> = {
	active:
		'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
	trialing: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
	canceled: 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-gray-500',
	past_due: 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400',
	incomplete:
		'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
	incomplete_expired:
		'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-gray-500',
	paused: 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-gray-500',
	unpaid: 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400',
};

function formatPeriodDate(dateStr: string | null): string {
	if (!dateStr) return '';
	const date = new Date(dateStr);
	return date.toLocaleDateString('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
}

function SubscriptionCell({
	subscription,
}: {
	subscription: CustomerSubscription | null | undefined;
}) {
	if (!subscription) {
		return (
			<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-gray-500">
				Sem assinatura
			</span>
		);
	}

	const colorClass =
		STATUS_COLORS[subscription.status] ??
		'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-gray-500';
	const label = STATUS_LABELS[subscription.status] ?? subscription.status;
	const date = formatPeriodDate(subscription.currentPeriodEnd);

	const periodText = date
		? subscription.cancelAtPeriodEnd
			? `Cancela em ${date}`
			: `Renova em ${date}`
		: null;

	const periodColor = subscription.cancelAtPeriodEnd
		? 'text-amber-600 dark:text-amber-400'
		: 'text-slate-500 dark:text-gray-500';

	return (
		<div className="flex flex-col gap-1">
			<span
				className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit ${colorClass}`}
			>
				{label}
			</span>
			{periodText && (
				<span className={`text-xs ${periodColor}`}>{periodText}</span>
			)}
		</div>
	);
}

export default function AlunosPage() {
	const router = useRouter();
	const { canAdmin, isLoading: permissionsLoading } = usePermissions();
	const {
		customers,
		isLoading,
		error,
		deleteCustomer,
		isDeleting,
		blockCustomer,
		isBlocking,
		changePassword,
		isChangingPassword,
	} = useCustomers();

	const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
	const [blockTarget, setBlockTarget] = useState<Customer | null>(null);
	const [passwordTarget, setPasswordTarget] = useState<Customer | null>(null);
	const [search, setSearch] = useState('');

	const filteredCustomers = customers.filter((c) =>
		c.name.toLowerCase().includes(search.toLowerCase()),
	);

	useEffect(() => {
		if (!permissionsLoading && !canAdmin) {
			router.replace('/dashboard');
		}
	}, [canAdmin, permissionsLoading, router]);

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
							<Users className="w-6 h-6 text-violet-400" />
							Gerenciar Alunos
						</h2>
						<p className="text-slate-600 dark:text-gray-400 mt-1">
							Bloqueie, exclua e gerencie as senhas dos alunos.
						</p>
					</div>
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500 pointer-events-none" />
						<input
							type="text"
							placeholder="Buscar por nome..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 w-64"
						/>
					</div>
				</div>

				{isLoading && (
					<div className="flex justify-center py-20 text-slate-600 dark:text-gray-400">
						A carregar alunos...
					</div>
				)}

				{error && (
					<div className="flex justify-center py-20 text-red-400">
						Erro ao carregar alunos.
					</div>
				)}

				{!isLoading && !error && (
					<div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-transparent shadow-sm dark:shadow-none">
						<table className="w-full text-sm">
							<thead>
								<tr className="bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-gray-400 text-left">
									<th className="px-4 py-3 font-medium">Nome</th>
									<th className="px-4 py-3 font-medium">E-mail</th>
									<th className="px-4 py-3 font-medium">Telefone</th>
									<th className="px-4 py-3 font-medium">Status</th>
									<th className="px-4 py-3 font-medium">Assinatura</th>
									<th className="px-4 py-3 font-medium text-right">Ações</th>
								</tr>
							</thead>
							<tbody>
								{filteredCustomers.length === 0 && (
									<tr>
										<td
											colSpan={6}
											className="px-4 py-10 text-center text-slate-500 dark:text-gray-500"
										>
											Nenhum aluno encontrado.
										</td>
									</tr>
								)}
								{filteredCustomers.map((customer) => (
									<tr
										key={customer.id}
										className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/2 transition-colors"
									>
										<td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
											{customer.name}
										</td>
										<td className="px-4 py-3 text-slate-600 dark:text-gray-400">
											{customer.email}
										</td>
										<td className="px-4 py-3 text-slate-600 dark:text-gray-400">
											{customer.phone ?? '—'}
										</td>
										<td className="px-4 py-3">
											{customer.banned ? (
												<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400">
													<ShieldOff className="w-3 h-3" />
													Bloqueado
												</span>
											) : (
												<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400">
													<ShieldCheck className="w-3 h-3" />
													Ativo
												</span>
											)}
										</td>
										<td className="px-4 py-3">
											<SubscriptionCell subscription={customer.subscription} />
										</td>
										<td className="px-4 py-3 text-right">
											<div className="flex items-center justify-end gap-2">
												<button
													type="button"
													onClick={() => setBlockTarget(customer)}
													className="p-2 text-slate-500 dark:text-gray-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
													title={customer.banned ? 'Desbloquear' : 'Bloquear'}
												>
													<ShieldOff className="w-4 h-4" />
												</button>
												<button
													type="button"
													onClick={() => setPasswordTarget(customer)}
													className="p-2 text-slate-500 dark:text-gray-400 hover:text-violet-500 hover:bg-violet-500/10 rounded-lg transition-colors"
													title="Alterar senha"
												>
													<KeyRound className="w-4 h-4" />
												</button>
												<button
													type="button"
													onClick={() => setDeleteTarget(customer)}
													className="p-2 text-slate-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
													title="Excluir"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</main>

			<DeleteCustomerModal
				customer={deleteTarget}
				isOpen={!!deleteTarget}
				onClose={() => setDeleteTarget(null)}
				onDelete={deleteCustomer}
				isDeleting={isDeleting}
			/>
			<BlockCustomerModal
				customer={blockTarget}
				isOpen={!!blockTarget}
				onClose={() => setBlockTarget(null)}
				onConfirm={(id, banned) => blockCustomer({ id, banned })}
				isLoading={isBlocking}
			/>
			<ChangePasswordModal
				customer={passwordTarget}
				isOpen={!!passwordTarget}
				onClose={() => setPasswordTarget(null)}
				onConfirm={(id, password) => changePassword({ id, password })}
				isLoading={isChangingPassword}
			/>
		</div>
	);
}
