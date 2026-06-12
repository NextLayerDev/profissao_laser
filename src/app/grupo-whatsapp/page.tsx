'use client';

import { MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/dashboard/header';
import { WaGroupAdminView } from '@/components/wa-group/wa-group-admin-view';
import { usePermissions } from '@/modules/access';

export default function GrupoWhatsappPage() {
	const router = useRouter();
	const { can, isLoading } = usePermissions();
	const allowed = can('alunos.view');

	useEffect(() => {
		if (!isLoading && !allowed) {
			router.replace('/dashboard');
		}
	}, [allowed, isLoading, router]);

	if (isLoading || !allowed) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-slate-600 dark:text-gray-400">A carregar...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />
			<main className="px-4 md:px-8 py-6">
				<div className="mb-6">
					<h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
						<MessageCircle className="w-6 h-6 text-emerald-500" />
						Grupo do WhatsApp — Plano Profissional
					</h2>
					<p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
						Quem assina o Profissional entra no grupo; quem cancela ou não paga
						sai. Marque aqui o que você já fez no WhatsApp — as listas se
						atualizam sozinhas conforme o status da assinatura.
					</p>
				</div>
				<WaGroupAdminView />
			</main>
		</div>
	);
}
