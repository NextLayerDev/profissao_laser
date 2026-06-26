'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/dashboard/header';
import { ToolsHub } from '@/components/tools/tools-hub';
import { usePermissions } from '@/modules/access';

/**
 * HUB de ferramentas do ADMIN — catálogo completo da Fábrica numa página
 * dedicada. Fica no shell do dashboard (sidebar de admin) porque `/ferramentas/*`
 * está em ADMIN_PATHS. O gating (super-admin) vive dentro de `useToolCatalog`,
 * mas mantemos o guard de rota igual às outras páginas de admin pra não exibir
 * o shell a quem não pode construir ferramentas.
 */
export default function FerramentasHubPage() {
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
				<ToolsHub audience="admin" />
			</main>
		</div>
	);
}
