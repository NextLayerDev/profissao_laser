'use client';

import {
	AlertTriangle,
	ChevronDown,
	Eye,
	EyeOff,
	KeyRound,
	Loader2,
	Lock,
	Search,
	ShieldCheck,
	ShieldOff,
	UserMinus,
	X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Header } from '@/components/dashboard/header';
import { PageHeader } from '@/components/ui/page-header';
import {
	parseApiError,
	useAccessUsers,
	useBlockUser,
	useChangeUserPassword,
	useDemoteUser,
	usePromoteUser,
} from '@/hooks/use-access-management';
import { usePermissions } from '@/hooks/use-permissions';
import { useMe } from '@/modules/me';
import type { User } from '@/types/users';

// ─── Constants ─────────────────────────────────────────────────────────────

type Role = 'admin' | 'staff' | 'customer';
type TabFilter = 'all' | Role;

const ROLE_RANK: Record<string, number> = {
	customer: 1,
	staff: 2,
	admin: 3,
};

const ROLE_LABEL: Record<string, string> = {
	admin: 'Admin',
	staff: 'Staff',
	customer: 'Customer',
};

const ROLE_STYLE: Record<string, string> = {
	admin:
		'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20',
	staff: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20',
	customer:
		'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20',
};

const ROLE_DOT: Record<string, string> = {
	admin: 'bg-violet-500',
	staff: 'bg-sky-500',
	customer: 'bg-slate-400',
};

// ─── Change role modal ──────────────────────────────────────────────────────

function ChangeRoleModal({
	user,
	onClose,
}: {
	user: User;
	onClose: () => void;
}) {
	const [selectedRole, setSelectedRole] = useState<Role>(
		(user.role as Role) ?? 'customer',
	);
	const promote = usePromoteUser();
	const demote = useDemoteUser();
	const isPending = promote.isPending || demote.isPending;
	const currentRank = ROLE_RANK[user.role] ?? 1;
	const roles: Role[] = ['admin', 'staff', 'customer'];

	async function handleConfirm() {
		if (selectedRole === user.role) {
			onClose();
			return;
		}
		const targetRank = ROLE_RANK[selectedRole] ?? 1;
		try {
			if (targetRank > currentRank) {
				await promote.mutateAsync({
					id: user.id,
					role: selectedRole as 'staff' | 'admin',
				});
			} else {
				await demote.mutateAsync({
					id: user.id,
					role: selectedRole as 'staff' | 'customer',
				});
			}
			toast.success(
				`Cargo de ${user.name} alterado para ${ROLE_LABEL[selectedRole]}.`,
			);
			onClose();
		} catch (err) {
			toast.error(parseApiError(err));
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<button
				type="button"
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			>
				<span className="sr-only">Fechar</span>
			</button>

			<div className="relative w-full max-w-sm bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6">
				<div className="flex items-start justify-between mb-5">
					<div>
						<h3 className="text-base font-bold text-slate-900 dark:text-white">
							Alterar cargo
						</h3>
						<p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
							{user.name}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				<div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/8">
					<p className="text-xs text-slate-400 dark:text-gray-500 mb-1">
						Cargo atual
					</p>
					<div className="flex items-center gap-2">
						<span
							className={`w-2 h-2 rounded-full ${ROLE_DOT[user.role] ?? 'bg-slate-400'}`}
						/>
						<span className="text-sm font-medium text-slate-900 dark:text-white">
							{ROLE_LABEL[user.role] ?? user.role}
						</span>
					</div>
				</div>

				<div className="space-y-2 mb-5">
					<p className="text-xs font-medium text-slate-500 dark:text-gray-400">
						Novo cargo
					</p>
					{roles.map((role) => {
						const rank = ROLE_RANK[role] ?? 1;
						const isPromotion = rank > currentRank;
						const isDemotion = rank < currentRank;
						const isCurrent = role === user.role;
						const isSelected = role === selectedRole;
						return (
							<button
								key={role}
								type="button"
								onClick={() => setSelectedRole(role)}
								disabled={isCurrent}
								className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
									isSelected && !isCurrent
										? 'border-violet-500/50 bg-violet-500/10 dark:bg-violet-500/10'
										: isCurrent
											? 'border-slate-100 dark:border-white/5 opacity-40 cursor-default'
											: 'border-slate-200 dark:border-white/8 hover:border-violet-500/30 hover:bg-violet-500/5'
								}`}
							>
								<span
									className={`w-2.5 h-2.5 rounded-full shrink-0 ${ROLE_DOT[role]}`}
								/>
								<span className="flex-1 text-sm font-medium text-slate-900 dark:text-white">
									{ROLE_LABEL[role]}
								</span>
								{isCurrent && (
									<span className="text-[10px] text-slate-400 dark:text-gray-600">
										atual
									</span>
								)}
								{!isCurrent && isPromotion && (
									<span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
										↑ promover
									</span>
								)}
								{!isCurrent && isDemotion && (
									<span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
										↓ rebaixar
									</span>
								)}
							</button>
						);
					})}
				</div>

				<div className="flex gap-3">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 h-10 rounded-xl text-sm font-medium bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/8 text-slate-700 dark:text-gray-300 transition-colors"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={handleConfirm}
						disabled={isPending || selectedRole === user.role}
						className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50"
					>
						{isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
						Confirmar
					</button>
				</div>
			</div>
		</div>
	);
}

// ─── Change password modal ──────────────────────────────────────────────────

function ChangePasswordModal({
	user,
	onClose,
}: {
	user: User;
	onClose: () => void;
}) {
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [showPwd, setShowPwd] = useState(false);
	const mutation = useChangeUserPassword();

	const canSubmit =
		password.length >= 6 && password === confirm && !mutation.isPending;

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!canSubmit) return;
		try {
			await mutation.mutateAsync({ id: user.id, new_password: password });
			toast.success(`Senha de ${user.name} alterada com sucesso.`);
			onClose();
		} catch (err) {
			toast.error(parseApiError(err));
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<button
				type="button"
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			>
				<span className="sr-only">Fechar</span>
			</button>

			<div className="relative w-full max-w-sm bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6">
				<div className="flex items-start justify-between mb-5">
					<div>
						<h3 className="text-base font-bold text-slate-900 dark:text-white">
							Trocar senha
						</h3>
						<p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
							{user.name}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label
							htmlFor="new-pwd"
							className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5"
						>
							Nova senha
						</label>
						<div className="relative">
							<input
								id="new-pwd"
								type={showPwd ? 'text' : 'password'}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Mínimo 6 caracteres"
								className="w-full pr-10 pl-4 h-10 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus:outline-none focus:border-violet-500 transition-colors"
							/>
							<button
								type="button"
								onClick={() => setShowPwd((v) => !v)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-gray-200 transition-colors"
							>
								{showPwd ? (
									<EyeOff className="w-4 h-4" />
								) : (
									<Eye className="w-4 h-4" />
								)}
							</button>
						</div>
					</div>

					<div>
						<label
							htmlFor="confirm-pwd"
							className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5"
						>
							Confirmar senha
						</label>
						<input
							id="confirm-pwd"
							type={showPwd ? 'text' : 'password'}
							value={confirm}
							onChange={(e) => setConfirm(e.target.value)}
							placeholder="Repita a nova senha"
							className={`w-full px-4 h-10 text-sm rounded-xl border bg-slate-50 dark:bg-white/5 focus:outline-none transition-colors ${
								confirm && confirm !== password
									? 'border-red-500/50 focus:border-red-500'
									: 'border-slate-200 dark:border-white/10 focus:border-violet-500'
							}`}
						/>
						{confirm && confirm !== password && (
							<p className="text-xs text-red-500 mt-1">
								As senhas não coincidem.
							</p>
						)}
					</div>

					<div className="flex gap-3 pt-1">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 h-10 rounded-xl text-sm font-medium bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/8 text-slate-700 dark:text-gray-300 transition-colors"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={!canSubmit}
							className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50"
						>
							{mutation.isPending && (
								<Loader2 className="w-3.5 h-3.5 animate-spin" />
							)}
							Salvar senha
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

// ─── User row ───────────────────────────────────────────────────────────────

function UserRow({
	user,
	currentUserId,
	onChangeRole,
	onChangePassword,
}: {
	user: User;
	currentUserId: string | undefined;
	onChangeRole: (user: User) => void;
	onChangePassword: (user: User) => void;
}) {
	const isSelf = user.id === currentUserId;
	const isBlocked = user.blocked === true;
	const roleStyle = ROLE_STYLE[user.role] ?? ROLE_STYLE.customer;
	const blockMutation = useBlockUser();

	async function handleToggleBlock() {
		try {
			await blockMutation.mutateAsync({ id: user.id, blocked: !isBlocked });
			toast.success(
				isBlocked
					? `${user.name} foi desbloqueado.`
					: `${user.name} foi bloqueado.`,
			);
		} catch (err) {
			toast.error(parseApiError(err));
		}
	}

	return (
		<tr
			className={`border-t border-slate-100 dark:border-white/5 transition-colors ${
				isBlocked
					? 'bg-red-50/30 dark:bg-red-950/10 hover:bg-red-50/50 dark:hover:bg-red-950/20'
					: 'hover:bg-violet-50/30 dark:hover:bg-violet-500/[0.03]'
			}`}
		>
			{/* Avatar + Name */}
			<td className="px-4 py-3.5">
				<div className="flex items-center gap-3">
					<div
						className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
							isBlocked
								? 'bg-red-500/15 text-red-500'
								: user.role === 'admin'
									? 'bg-violet-500/15 text-violet-600 dark:text-violet-400'
									: user.role === 'staff'
										? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
										: 'bg-slate-200 dark:bg-white/8 text-slate-600 dark:text-gray-400'
						}`}
					>
						{(user.name ?? user.email)[0]?.toUpperCase() ?? '?'}
					</div>
					<div className="min-w-0">
						<p
							className={`text-sm font-medium truncate max-w-[180px] ${isBlocked ? 'text-slate-400 dark:text-gray-500 line-through' : 'text-slate-900 dark:text-white'}`}
						>
							{user.name ?? '—'}
							{isSelf && (
								<span className="ml-1.5 text-[10px] font-normal text-slate-400 dark:text-gray-500 no-underline">
									(você)
								</span>
							)}
						</p>
						<p className="text-xs text-slate-400 dark:text-gray-500 truncate max-w-[180px]">
							{user.email}
						</p>
					</div>
				</div>
			</td>

			{/* Role + blocked badge */}
			<td className="px-4 py-3.5">
				<div className="flex items-center gap-2 flex-wrap">
					<span
						className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${roleStyle}`}
					>
						<span
							className={`w-1.5 h-1.5 rounded-full ${ROLE_DOT[user.role] ?? 'bg-slate-400'}`}
						/>
						{ROLE_LABEL[user.role] ?? user.role}
					</span>
					{isBlocked && (
						<span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20">
							<Lock className="w-2.5 h-2.5" />
							Bloqueado
						</span>
					)}
				</div>
			</td>

			{/* Member since */}
			<td className="px-4 py-3.5 text-sm text-slate-500 dark:text-gray-400 whitespace-nowrap">
				{user.created_at
					? new Date(user.created_at).toLocaleDateString('pt-BR', {
							day: '2-digit',
							month: 'short',
							year: 'numeric',
						})
					: '—'}
			</td>

			{/* Actions */}
			<td className="px-4 py-3.5">
				{isSelf ? (
					<span className="text-xs text-slate-300 dark:text-gray-700 select-none">
						—
					</span>
				) : (
					<div className="flex items-center justify-end gap-2">
						{/* Cargo */}
						<button
							type="button"
							onClick={() => onChangeRole(user)}
							className="inline-flex items-center gap-1.5 px-3 h-8 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:border-violet-500/40 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-500/8 transition-colors"
						>
							Cargo
							<ChevronDown className="w-3 h-3" />
						</button>

						{/* Senha */}
						<button
							type="button"
							onClick={() => onChangePassword(user)}
							title="Trocar senha"
							className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 hover:border-sky-500/40 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-500/8 transition-colors"
						>
							<KeyRound className="w-3.5 h-3.5" />
						</button>

						{/* Bloquear / desbloquear */}
						<button
							type="button"
							onClick={handleToggleBlock}
							disabled={blockMutation.isPending}
							title={isBlocked ? 'Desbloquear usuário' : 'Bloquear usuário'}
							className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors disabled:opacity-50 ${
								isBlocked
									? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
									: 'border-red-500/30 text-red-500 dark:text-red-400 hover:bg-red-500/10'
							}`}
						>
							{blockMutation.isPending ? (
								<Loader2 className="w-3.5 h-3.5 animate-spin" />
							) : isBlocked ? (
								<ShieldCheck className="w-3.5 h-3.5" />
							) : (
								<ShieldOff className="w-3.5 h-3.5" />
							)}
						</button>
					</div>
				)}
			</td>
		</tr>
	);
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function AccessPage() {
	const router = useRouter();
	const { canAdmin, isLoading: permissionsLoading } = usePermissions();
	const { data: me } = useMe();
	const { data: users, isLoading, error } = useAccessUsers();

	const [tab, setTab] = useState<TabFilter>('all');
	const [search, setSearch] = useState('');
	const [changeRoleTarget, setChangeRoleTarget] = useState<User | null>(null);
	const [changePasswordTarget, setChangePasswordTarget] = useState<User | null>(
		null,
	);

	useEffect(() => {
		if (!permissionsLoading && !canAdmin) {
			router.replace('/dashboard');
		}
	}, [canAdmin, permissionsLoading, router]);

	const counts = useMemo(() => {
		if (!users) return { all: 0, admin: 0, staff: 0, customer: 0 };
		return {
			all: users.length,
			admin: users.filter((u) => u.role === 'admin').length,
			staff: users.filter((u) => u.role === 'staff').length,
			customer: users.filter((u) => u.role === 'customer').length,
		};
	}, [users]);

	const filtered = useMemo(() => {
		if (!users) return [];
		let list = users;
		if (tab !== 'all') list = list.filter((u) => u.role === tab);
		if (search.trim()) {
			const q = search.toLowerCase();
			list = list.filter(
				(u) =>
					u.name?.toLowerCase().includes(q) ||
					u.email.toLowerCase().includes(q),
			);
		}
		return [...list].sort((a, b) => {
			const rd = (ROLE_RANK[b.role] ?? 0) - (ROLE_RANK[a.role] ?? 0);
			if (rd !== 0) return rd;
			return (a.name ?? '').localeCompare(b.name ?? '');
		});
	}, [users, tab, search]);

	if (permissionsLoading || !canAdmin) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="w-6 h-6 animate-spin text-violet-500" />
			</div>
		);
	}

	const tabs: {
		key: TabFilter;
		label: string;
		count: number;
	}[] = [
		{ key: 'all', label: 'Todos', count: counts.all },
		{ key: 'admin', label: 'Admin', count: counts.admin },
		{ key: 'staff', label: 'Staff', count: counts.staff },
		{ key: 'customer', label: 'Customer', count: counts.customer },
	];

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />

			<main className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
				<PageHeader
					title="Gestão de Acessos"
					subtitle="Gerencie cargos, senhas e bloqueios de usuários."
					icon={ShieldCheck}
				/>

				{/* Tabs + search */}
				<div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
					<div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/5 w-fit">
						{tabs.map((t) => (
							<button
								key={t.key}
								type="button"
								onClick={() => setTab(t.key)}
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
									tab === t.key
										? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
										: 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
								}`}
							>
								{t.label}
								<span
									className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
										tab === t.key
											? 'bg-violet-500/15 text-violet-600 dark:text-violet-400'
											: 'bg-slate-200 dark:bg-white/8 text-slate-500 dark:text-gray-500'
									}`}
								>
									{t.count}
								</span>
							</button>
						))}
					</div>

					<div className="relative flex-1 max-w-sm">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
						<input
							type="text"
							placeholder="Buscar por nome ou e-mail..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full pl-9 pr-3 h-9 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:border-violet-500 transition-colors"
						/>
						{search && (
							<button
								type="button"
								onClick={() => setSearch('')}
								className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-gray-200"
							>
								<X className="w-3.5 h-3.5" />
							</button>
						)}
					</div>
				</div>

				{/* Table */}
				<div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-linear-to-b from-white to-slate-50/50 dark:from-[#1a1a1d] dark:to-[#141416]">
					<div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-violet-500/30 to-transparent pointer-events-none" />

					{error ? (
						<div className="flex items-center gap-3 p-8 text-red-500">
							<AlertTriangle className="w-5 h-5 shrink-0" />
							<p className="text-sm">
								Erro ao carregar usuários. Tente novamente.
							</p>
						</div>
					) : isLoading ? (
						<div className="flex justify-center py-16">
							<Loader2 className="w-7 h-7 animate-spin text-violet-500" />
						</div>
					) : filtered.length === 0 ? (
						<div className="py-16 text-center">
							<UserMinus className="w-8 h-8 text-slate-300 dark:text-gray-700 mx-auto mb-3" />
							<p className="text-sm text-slate-500 dark:text-gray-400">
								{search
									? 'Nenhum usuário encontrado para esta busca.'
									: 'Nenhum usuário nesta categoria.'}
							</p>
						</div>
					) : (
						<table className="w-full text-sm">
							<thead>
								<tr className="bg-slate-50/80 dark:bg-white/[0.02] text-xs text-slate-400 dark:text-gray-500 uppercase tracking-wide">
									<th className="px-4 py-3 text-left font-medium">Usuário</th>
									<th className="px-4 py-3 text-left font-medium">Cargo</th>
									<th className="px-4 py-3 text-left font-medium">
										Membro desde
									</th>
									<th className="px-4 py-3 text-right font-medium">Ações</th>
								</tr>
							</thead>
							<tbody>
								{filtered.map((user) => (
									<UserRow
										key={user.id}
										user={user}
										currentUserId={me?.id}
										onChangeRole={setChangeRoleTarget}
										onChangePassword={setChangePasswordTarget}
									/>
								))}
							</tbody>
						</table>
					)}

					{!isLoading && !error && filtered.length > 0 && (
						<div className="px-4 py-2.5 border-t border-slate-100 dark:border-white/5 text-xs text-slate-400 dark:text-gray-600">
							{filtered.length} usuário{filtered.length !== 1 ? 's' : ''}
							{tab !== 'all' && ` · filtrando por ${ROLE_LABEL[tab]}`}
						</div>
					)}
				</div>
			</main>

			{changeRoleTarget && (
				<ChangeRoleModal
					user={changeRoleTarget}
					onClose={() => setChangeRoleTarget(null)}
				/>
			)}

			{changePasswordTarget && (
				<ChangePasswordModal
					user={changePasswordTarget}
					onClose={() => setChangePasswordTarget(null)}
				/>
			)}
		</div>
	);
}
