'use client';

import { Loader2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Header } from '@/components/dashboard/header';
import { MonthSummary } from '@/components/dashboard/month-summary';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { getToken } from '@/lib/auth';

export default function Dashboard() {
	// Gate: staff/admin têm pl_user_token; customers não. home.view controla
	// visibilidade do item no menu, não o acesso ao painel em si — staff com
	// outras permissões (suporte.view, alunos.view, etc.) também devem acessar.
	const [allowed, setAllowed] = useState<boolean | null>(null);

	useEffect(() => {
		setAllowed(!!getToken('user'));
	}, []);

	if (allowed === null) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	if (!allowed) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<ShieldAlert className="w-12 h-12 text-slate-400 dark:text-gray-600 mx-auto mb-4" />
					<p className="text-slate-600 dark:text-gray-400 font-medium mb-2">
						Você não tem permissão
					</p>
					<p className="text-sm text-slate-500 dark:text-gray-500 mb-4">
						Esta página é apenas para administradores e staff.
					</p>
					<Link
						href="/course"
						className="inline-block px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
					>
						Ir para meus cursos
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />
			<main className="px-4 md:px-8 py-6 space-y-8">
				<StatsOverview />
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2">
						<RecentActivity />
					</div>
					<div>
						<MonthSummary />
					</div>
				</div>
			</main>
			<footer className="px-4 md:px-8 py-4 mt-4 text-center text-xs text-slate-400 dark:text-gray-600">
				© 2024 Profissão Laser. Todos os direitos reservados.
			</footer>
		</div>
	);
}
