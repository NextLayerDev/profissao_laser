'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/dashboard/header';
import { ToolAnalyticsView } from '@/components/ferramentas/tool-analytics-view';
import { usePermissions } from '@/modules/access';

/**
 * Analytics de uso de ferramentas (ADMIN) — dashboard genérico que faz GROUP BY
 * tool_key no backend, então toda ferramenta aparece sozinha. Fica no shell do
 * dashboard porque `/ferramentas/*` está em ADMIN_PATHS. O guard de rota espelha
 * a página `/ferramentas/hub`: exige `tools.build`, senão redireciona pra
 * `/dashboard` (não exibe o shell a quem não pode gerir ferramentas).
 */
export default function FerramentasAnalyticsPage() {
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
				<ToolAnalyticsView />
			</main>
		</div>
	);
}
