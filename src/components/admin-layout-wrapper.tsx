'use client';

import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';

const ADMIN_PATHS = [
	'/dashboard',
	'/products',
	'/courses',
	'/planos',
	'/sales',
	'/links',
	'/reports',
	'/community',
	'/forum',
	'/agendamentos',
	'/acessos',
	'/alunos',
	'/duvidas-admin',
	'/suporte',
	'/parametros',
	'/previas-admin',
	'/vetorizacao-admin',
	'/ferramentas',
];

export function AdminLayoutWrapper({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const [collapsed, setCollapsed] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: close mobile menu on route change
	useEffect(() => {
		setMobileOpen(false);
	}, [pathname]);

	const isAdmin = ADMIN_PATHS.some(
		(p) => pathname === p || pathname.startsWith(`${p}/`),
	);

	if (!isAdmin) return <>{children}</>;

	return (
		<div className="relative flex min-h-screen bg-slate-100 dark:bg-[#080809]">
			<div className="hidden dark:block absolute inset-0 pointer-events-none overflow-hidden">
				<div className="absolute top-25 left-[20%] w-125 h-125 bg-blue-900/15 rounded-full blur-3xl" />
				<div className="absolute bottom-12.5 right-[10%] w-100 h-100 bg-indigo-900/15 rounded-full blur-3xl" />
				<div className="absolute top-[30%] right-[30%] w-75 h-75 bg-blue-800/8 rounded-full blur-3xl" />
			</div>

			{/* Desktop sidebar */}
			<div className="hidden md:block">
				<Sidebar
					collapsed={collapsed}
					onToggle={() => setCollapsed((v) => !v)}
				/>
			</div>

			{/* Mobile sidebar overlay */}
			{mobileOpen && (
				<div className="fixed inset-0 z-50 md:hidden">
					{/* biome-ignore lint/a11y/useSemanticElements: backdrop overlay wraps modal content */}
					<div
						className="absolute inset-0 bg-black/50"
						onClick={() => setMobileOpen(false)}
						onKeyDown={(e) => e.key === 'Escape' && setMobileOpen(false)}
						role="button"
						tabIndex={0}
						aria-label="Fechar menu"
					/>
					<div className="relative w-56 h-full">
						<Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
						<button
							type="button"
							onClick={() => setMobileOpen(false)}
							className="absolute top-4 right-[-44px] w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
						>
							<X className="w-4 h-4" />
						</button>
					</div>
				</div>
			)}

			{/* Main content */}
			<div
				className={`relative z-10 flex-1 transition-all duration-300 ${collapsed ? 'md:ml-16' : 'md:ml-56'}`}
			>
				{/* Mobile header with hamburger */}
				<div className="sticky top-0 z-20 flex items-center gap-3 h-14 px-4 bg-white/80 dark:bg-[#080809]/90 backdrop-blur-lg border-b border-slate-200 dark:border-white/10 md:hidden">
					<button
						type="button"
						onClick={() => setMobileOpen(true)}
						className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5"
					>
						<Menu className="w-5 h-5" />
					</button>
					<span className="text-sm font-semibold text-slate-900 dark:text-white">
						Profissao Laser
					</span>
				</div>
				{children}
			</div>
		</div>
	);
}
