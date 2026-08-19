'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/dashboard/header';
import { LicensedBrandsView } from '@/components/ferramentas/licensed-brands-view';
import { usePermissions } from '@/modules/access';

/**
 * Marcas licenciadas (ADMIN) — escudo, mascote e nome público de cada clube.
 *
 * Mesmo guard das outras telas de `/ferramentas/*`: exige `tools.build`, senão
 * redireciona. Quem cadastra marca licenciada é quem constrói ferramenta.
 */
export default function FerramentasMarcasPage() {
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
				<LicensedBrandsView />
			</main>
		</div>
	);
}
