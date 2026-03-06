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
				className="flex items-center gap-2 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 hover:border-violet-500/50 px-3 py-1.5 rounded-xl text-sm text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all duration-200 shadow-sm dark:shadow-none"
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
				<div className="flex items-center gap-2 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 px-3 py-1.5 rounded-xl shadow-sm dark:shadow-none">
					<span className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
						{initials}
					</span>
					<span className="text-sm text-slate-900 dark:text-white font-medium max-w-[120px] truncate">
						{displayName}
					</span>
				</div>
				{isAdminUser && user.sub && (
					<button
						type="button"
						onClick={() => setShowChangePassword(true)}
						title="Trocar senha"
						className="p-1.5 rounded-lg text-slate-500 dark:text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all duration-200 cursor-pointer"
					>
						<KeyRound className="w-4 h-4" />
					</button>
				)}
				<button
					type="button"
					onClick={handleLogout}
					title="Sair"
					className="p-1.5 rounded-lg text-slate-500 dark:text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
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
