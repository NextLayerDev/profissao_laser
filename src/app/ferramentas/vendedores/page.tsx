'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/dashboard/header';
import { LicensedSellersView } from '@/components/ferramentas/licensed-sellers-view';
import { usePermissions } from '@/modules/access';

/**
 * Vendedores declarados (ADMIN) — onde cada aluno vende e quando aceitou o termo.
 *
 * Mesmo guard das outras telas de `/ferramentas/*`: exige `tools.build`, senão
 * redireciona. Quem enxerga a declaração é quem responde ao licenciante.
 */
export default function FerramentasVendedoresPage() {
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
				<LicensedSellersView />
			</main>
		</div>
	);
}
