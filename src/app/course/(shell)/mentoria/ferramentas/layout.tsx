'use client';

// Seção Ferramentas bloqueada pelo admin (Admin › Ferramentas › chave no topo):
// enquanto o mentor revisa as ferramentas, o aluno vê o aviso e o atalho para
// começar pelo Plano de Negócios. A API também recusa (403
// mentoria_tools_locked); isto aqui é a cara do bloqueio.

import { Lock } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useMentoriaToolsLocked } from '@/modules/mentoria/hooks';
import { BTN_PRIMARY, EmptyState } from '../_components/shared';

export default function FerramentasLayout({
	children,
}: {
	children: ReactNode;
}) {
	if (!useMentoriaToolsLocked()) return <>{children}</>;
	return (
		<EmptyState
			icon={Lock}
			title="Ferramentas em atualização"
			description="Seu mentor está preparando as ferramentas. Enquanto isso, comece pelo Plano de Negócios."
		>
			<Link
				href="/course/mentoria/desenvolvimento?aba=plano"
				className={BTN_PRIMARY}
			>
				Ir para o Plano de Negócios
			</Link>
		</EmptyState>
	);
}
