'use client';

import { Bot } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/dashboard/header';
import { usePermissions } from '@/modules/access';
import { OmniView } from '@/modules/omni/components/omni-view';
import { canSeeNavItem } from '@/utils/constants/permissions';

/**
 * OmniResposta — automação de atendimento WhatsApp por IA (aba do expert).
 * Gate: permissão `omniresposta.view` (admin sempre vê), mesmo padrão do
 * Suporte. Cada mensagem respondida pela IA cobra 0,2 voxxys do expert.
 */
export default function OmniRespostaPage() {
	const router = useRouter();
	const { can, isLoading } = usePermissions();
	const allowed = canSeeNavItem('OmniResposta', can);

	useEffect(() => {
		if (!isLoading && !allowed) router.replace('/dashboard');
	}, [isLoading, allowed, router]);

	if (isLoading || !allowed) {
		return (
			<div className="min-h-screen bg-slate-50 dark:bg-[#0f0f11]">
				<Header />
				<div className="grid h-[60vh] place-items-center">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#0f0f11]">
			<Header />
			<main className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
				<div className="mb-4">
					<h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
						<Bot className="h-6 w-6 text-violet-500" />
						OmniResposta
					</h1>
					<p className="mt-1 text-sm text-slate-600 dark:text-gray-400">
						Sua IA atendendo no WhatsApp — agentes, base de conhecimento e
						controle total das conversas.
					</p>
				</div>
				<OmniView />
			</main>
		</div>
	);
}
