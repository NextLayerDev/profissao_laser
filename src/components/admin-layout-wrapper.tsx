'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';

const ADMIN_PATHS = [
	'/dashboard',
	'/products',
	'/sales',
	'/links',
	'/reports',
	'/community',
	'/forum',
	'/agendamentos',
	'/acessos',
	'/alunos',
	'/duvidas-admin',
];

export function AdminLayoutWrapper({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const [collapsed, setCollapsed] = useState(false);

	const isAdmin = ADMIN_PATHS.some(
		(p) => pathname === p || pathname.startsWith(`${p}/`),
	);

	if (!isAdmin) return <>{children}</>;

	return (
		<div className="relative flex min-h-screen bg-slate-100 dark:bg-[#080809]">
			{/* Dark mode background orbs */}
			<div className="hidden dark:block absolute inset-0 pointer-events-none overflow-hidden">
				<div className="absolute top-25 left-[20%] w-125 h-125 bg-blue-900/15 rounded-full blur-3xl" />
				<div className="absolute bottom-12.5 right-[10%] w-100 h-100 bg-indigo-900/15 rounded-full blur-3xl" />
				<div className="absolute top-[30%] right-[30%] w-75 h-75 bg-blue-800/8 rounded-full blur-3xl" />
			</div>
			<Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
			<div
				className={`relative z-10 flex-1 transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-56'}`}
			>
				{children}
			</div>
		</div>
	);
}
