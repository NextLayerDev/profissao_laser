'use client';

import { LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { clearToken, getCurrentUser, type JwtPayload } from '@/lib/auth';

export function UserBadge() {
	const [user, setUser] = useState<JwtPayload | null>(null);

	useEffect(() => {
		setUser(getCurrentUser());
	}, []);

	function handleLogout() {
		clearToken('customer');
		clearToken('user');
		setUser(null);
	}

	if (!user) {
		return (
			<Link
				href="/login"
				className="flex items-center gap-2 bg-[#1a1a1d] border border-gray-800 hover:border-violet-500/50 px-3 py-1.5 rounded-xl text-sm text-gray-400 hover:text-white transition-all duration-200"
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
		<div className="flex items-center gap-2">
			<div className="flex items-center gap-2 bg-[#1a1a1d] border border-gray-800 px-3 py-1.5 rounded-xl">
				<span className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
					{initials}
				</span>
				<span className="text-sm text-white font-medium max-w-[120px] truncate">
					{displayName}
				</span>
			</div>
			<button
				type="button"
				onClick={handleLogout}
				title="Sair"
				className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
			>
				<LogOut className="w-4 h-4" />
			</button>
		</div>
	);
}
