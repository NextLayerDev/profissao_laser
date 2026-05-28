'use client';

import { KeyRound, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChangePasswordModal } from '@/components/auth/change-password-modal';
import {
	clearToken,
	getCurrentUser,
	getToken,
	type JwtPayload,
} from '@/lib/auth';

export function UserBadge() {
	const pathname = usePathname();
	const router = useRouter();
	const [user, setUser] = useState<JwtPayload | null>(null);
	const [showChangePassword, setShowChangePassword] = useState(false);

	useEffect(() => {
		setUser(getCurrentUser());
	}, []);

	function handleLogout() {
		const wasAdmin = !!getToken('user');
		clearToken('customer');
		clearToken('user');
		setUser(null);
		if (wasAdmin) {
			router.replace('/login/admin');
		} else {
			router.replace('/login');
		}
	}

	const isCustomerArea =
		pathname.startsWith('/store') ||
		pathname.startsWith('/course') ||
		pathname.startsWith('/comunity') ||
		pathname.startsWith('/vetorizacao') ||
		pathname.startsWith('/biblioteca-vetores');
	const loginHref = isCustomerArea ? '/login' : '/login/admin';
	const isAdminUser = !!getToken('user');

	if (!user) {
		return (
			<Link
				href={loginHref}
				className="flex items-center gap-2 bg-slate-100 dark:bg-transparent border border-slate-200 dark:border-transparent hover:bg-slate-200 dark:hover:bg-white/10 px-3 py-1.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
			>
				<User className="w-4 h-4" />
				Entrar
			</Link>
		);
	}

	const initials = (user.name ?? user.email ?? '?')
		.split(' ')
		.slice(0, 2)
		.map((w) => w[0])
		.join('')
		.toUpperCase();

	const displayName = user.name?.split(' ')[0] ?? user.email ?? 'Usuário';

	return (
		<>
			<div className="flex items-center gap-2">
				<div className="flex items-center gap-2 bg-slate-100 dark:bg-transparent border border-slate-200 dark:border-transparent px-3 py-1.5 rounded-lg">
					<span className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
						{initials}
					</span>
					<span className="text-sm text-slate-900 dark:text-white font-medium max-w-[120px] truncate">
						{displayName}
					</span>
				</div>
				{!isAdminUser && (
					<Link
						href="/course/perfil"
						title="Meu perfil"
						className="p-1.5 rounded-lg text-slate-500 dark:text-gray-400 hover:text-violet-400 dark:hover:text-violet-300 hover:bg-violet-500/10 transition-all duration-200"
					>
						<User className="w-4 h-4" />
					</Link>
				)}
				{isAdminUser && user.sub && (
					<button
						type="button"
						onClick={() => setShowChangePassword(true)}
						title="Trocar senha"
						className="p-1.5 rounded-lg text-slate-500 dark:text-gray-400 hover:text-violet-400 dark:hover:text-violet-300 hover:bg-violet-500/10 transition-all duration-200 cursor-pointer"
					>
						<KeyRound className="w-4 h-4" />
					</button>
				)}
				<button
					type="button"
					onClick={handleLogout}
					title="Sair"
					className="p-1.5 rounded-lg text-slate-500 dark:text-gray-400 hover:text-red-400 dark:hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
				>
					<LogOut className="w-4 h-4" />
				</button>
			</div>

			{isAdminUser && user.sub && (
				<ChangePasswordModal
					isOpen={showChangePassword}
					onClose={() => setShowChangePassword(false)}
					userId={user.sub}
				/>
			)}
		</>
	);
}
