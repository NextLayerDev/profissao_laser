'use client';

import { BookOpen, CalendarClock, LayoutDashboard, Store } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppointmentsTable } from '@/components/agendamentos/appointments-table';
import { ClientAppointmentsView } from '@/components/agendamentos/client-appointments-view';
import { Header } from '@/components/dashboard/header';
import { UserBadge } from '@/components/store/user-badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { getToken } from '@/lib/auth';

function CustomerHeader() {
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		setIsAdmin(!!getToken('user'));
	}, []);

	return (
		<header className="border-b border-slate-200 dark:border-gray-800 bg-slate-50/80 dark:bg-[#0d0d0f]/80 backdrop-blur-sm sticky top-0 z-10">
			<div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
				<div className="flex items-center gap-2">
					<CalendarClock className="w-6 h-6 text-violet-400" />
					<span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
						Profissão Laser
					</span>
				</div>

				<div className="flex items-center gap-2">
					<ThemeToggle />
					{isAdmin && (
						<Link
							href="/dashboard"
							className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 hover:border-violet-500/50 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium rounded-xl transition-colors shadow-sm dark:shadow-none"
						>
							<LayoutDashboard className="w-4 h-4" />
							Painel
						</Link>
					)}
					<Link
						href="/store"
						className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 hover:border-violet-500/50 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium rounded-xl transition-colors shadow-sm dark:shadow-none"
					>
						<Store className="w-4 h-4" />
						Loja
					</Link>
					<Link
						href="/course"
						className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
					>
						<BookOpen className="w-4 h-4" />
						Meus Cursos
					</Link>
					<UserBadge />
				</div>
			</div>
		</header>
	);
}

export default function AgendamentosPage() {
	const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

	useEffect(() => {
		setIsAdmin(!!getToken('user'));
	}, []);

	if (isAdmin === null) {
		return (
			<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] flex items-center justify-center">
				<div className="text-slate-600 dark:text-gray-400">A carregar...</div>
			</div>
		);
	}

	if (isAdmin) {
		return (
			<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] text-slate-900 dark:text-white font-sans">
				<Header />
				<main className="px-8 py-6">
					<div className="mb-6">
						<h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
							<CalendarClock className="w-6 h-6 text-violet-400" />
							Gestão de Agendamentos
						</h2>
						<p className="text-slate-600 dark:text-gray-400 mt-1">
							Visualize e gerencie os agendamentos de atendimentos.
						</p>
					</div>
					<AppointmentsTable />
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] text-slate-900 dark:text-white font-sans">
			<CustomerHeader />
			<main className="max-w-5xl mx-auto px-6 py-10">
				<div className="mb-8">
					<h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
						Meus agendamentos
					</h1>
					<p className="text-slate-600 dark:text-gray-400 mt-1">
						Visualize os seus agendamentos e marque novos atendimentos.
					</p>
				</div>
				<ClientAppointmentsView />
			</main>
		</div>
	);
}
