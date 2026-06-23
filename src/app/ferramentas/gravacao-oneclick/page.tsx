'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/dashboard/header';
import { GravacaoOneClickView } from '@/components/gravacao-oneclick/gravacao-oneclick-view';
import { usePermissions } from '@/modules/access';

/**
 * Tela ADMIN da Gravação 1-Clique — fica no shell de admin (`/ferramentas/*`
 * está em ADMIN_PATHS, então a sidebar do dashboard envolve a página). REUSA a
 * MESMA view do cliente, sem tocar no funcionamento: o motor, a cobrança e a
 * página `/course/gravacao-oneclick` seguem idênticos. Sem SubscriptionGate —
 * admin/staff usa direto (a view roda livre p/ staff, igual hoje).
 */
export default function GravacaoOneClickAdminPage() {
	const router = useRouter();
	const { can, isLoading } = usePermissions();
	const allowed = can('tools.build');

	useEffect(() => {
		if (!isLoading && !allowed) router.replace('/dashboard');
	}, [allowed, isLoading, router]);

	if (isLoading || !allowed) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Loader2 className="h-6 w-6 animate-spin text-slate-400" />
			</div>
		);
	}

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />
			<main className="px-4 py-6 md:px-8">
				<GravacaoOneClickView />
			</main>
		</div>
	);
}
